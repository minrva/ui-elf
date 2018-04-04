// okapi headers
let OKAPI_HEADERS = {
    'X-Okapi-Tenant': TENANT,
    'X-Okapi-Token': null
};

// business objects
let user = null;
let item = null;
let itemInfo = null;

// util
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

function parseDateTime(dateStr, timeStr) {
    let dateParts = dateStr.split('/');
    let timeParts = timeStr.split(':');
    let year = Number(dateParts[2]);
    let month = Number(dateParts[0]) - 1;
    let date = Number(dateParts[1]);
    let hours = Number(timeParts[0]);
    let minutes = Number(timeParts[1]);
    return new Date(year, month, date, hours, minutes);
};

function formatDate(dd, mm, yyyy) {
    mm = mm + 1;
    if (mm < 10) mm = '0' + mm;
    if (dd < 10) dd = '0' + dd;
    return mm + '/' + dd + '/' + yyyy;
};

function formatTime(mm, hh) {
    if (hh < 10) hh = '0' + hh;
    if (mm < 10) mm = '0' + mm;
    return hh + ':' + mm;
};

function createDate(orgDate, daysOffset) {
    let year = orgDate.getFullYear();
    let month = orgDate.getMonth();
    let date = orgDate.getDate() + daysOffset;
    return new Date(year, month, date);
};

function showServiceError(serviceName, errStatus) {
    let msg = 'Sorry, there was a problem with the ' + serviceName + ' service.'
    if (errStatus === 401) {
        msg = 'Sorry, you are unauthorized with the ' + serviceName + ' service.';
    }
    alert(msg);
};

// POST EMAIL
function createEmail(user, item) {
    let itemList = [];
    let table = document.getElementById("modifyTable");
    let tableLength = table.getElementsByTagName("tr").length;
    for (let i = 0; i < tableLength; i++) {
        itemList.push(table.rows[i].cells[0].innerHTML);
    }
    return {
        id: uuidv4(),
        itemid: (item || {}).id,
        email: ((user || {}).personal || {}).email,
        itemname: (item || {}).title,
        returnday: $("#returndate").val(),
        returntime: $("#returntime").val(),
        piece_list: itemList
    };
};

function emailFailureHandler(data, status, xhr) {
    console.log("Email service experienced an error...");
    console.log(xhr.error);
    showServiceError('Email', xhr.status);
};

function emailSuccessHandler(data, status, xhr) {
    console.log("Email service responded...");
    window.location.href = 'index.html';
};

function postEmail(email) {
    let pdf = new jsPDF('p', 'pt', 'legal');
    console.log("Starting to send email");
    pdf.addHTML(document.body, function () {
        email['pdf'] = pdf.output('dataurlstring');
        let emailerService = HOST + '/emailer';
        $.ajax({
            url: emailerService,
            type: 'POST',
            data: JSON.stringify(email),
            cache: false,
            contentType: 'application/json',
            processData: false,
            headers: OKAPI_HEADERS,
            success: emailSuccessHandler,
            error: emailFailureHandler
        })
    })
};

// POST LOAN
function createLoan(user, item) {
    let loan = {};
    loan['id'] = uuidv4();
    loan['userId'] = (user || {}).id;
    loan['itemId'] = (item || {}).id;
    loan['loanDate'] = parseDateTime($("#checkoutdate").val(), $("#checkouttime").val());
    loan['dueDate'] = parseDateTime($("#returndate").val(), $("#returntime").val());
    loan['action'] = 'checkedout';
    loan['status'] = {};
    loan['status']['name'] = 'Open';
    return loan;
};

function loanFailureHandler(xhr) {
    console.log("Loan service experienced an error...");
    console.log(xhr.error);
    showServiceError('Loan', xhr.status);
};

function loanSuccessHandler(data, status, xhr) {
    console.log("Loan service got a response...");
    let email = createEmail(user, item);
    postEmail(email);
};

function postLoan(loan) {
    console.log("Posting loan request for item " + loan['itemId'] + "...");
    console.log(loan);
    let circulationService = HOST + '/circulation/loans';
    $.ajax({
        url: circulationService,
        type: 'POST',
        data: JSON.stringify(loan),
        cache: false,
        contentType: 'application/json',
        processData: false,
        headers: OKAPI_HEADERS,
        success: loanSuccessHandler,
        error: loanFailureHandler
    });
};

function onLoanSubmitClick() {
    console.log('onLoanSubmitClick');
    console.log(user);
    console.log(item);
    const loan = createLoan(user, item);
    postLoan(loan);
};

// ITEM INFO
function onItemRemoveClick() {
    if (itemInfo) {
        let deleted = $('input:checkbox:checked').length;
        let revised_pieces = itemInfo.total_pieces - deleted;
        revised_total = revised_pieces;
        $('#Total_pieces2').html("Total parts: " + revised_pieces);
        $('input:checkbox:checked').parents("tr").remove();
        itemInfo.total_pieces = revised_total;
    }
};

function getAgreement(price, location, penalty, filedDuration, legalNotice) {
    let agreement = CHECKOUT_AGREEMENT_TEMPLATE;
    agreement = agreement.replace(/@@PRICE@@/g, price);
    agreement = agreement.replace(/@@LOCATION@@/g, location);
    agreement = agreement.replace(/@@PENALTY@@/g, penalty);
    agreement = agreement.replace(/@@FILE_DURATION@@/g, filedDuration);
    agreement = agreement.replace(/@@LEGAL_NOTICE@@/g, legalNotice);
    return agreement;
};

function createItemInfoVm(itemInfo) {
    return {
        price: (itemInfo || {}).price || 'Error',
        pieces: (itemInfo || {}).piece_list || [],
        pieceCount: (itemInfo || {}).total_pieces || -1    
    }
}

function bindItemInfo(itemInfoVm) {
    // item info section
    if (itemInfoVm.pieces.length != itemInfoVm.pieceCount) {
        alert('Warning! Total parts do not match total contents. Please remove missing parts.');
    }
    $('#Total_pieces2').text("Total parts: " + itemInfoVm.pieceCount);
    $('#modifyTable').empty();
    let table = document.getElementById("modifyTable");
    for (var i = 0; i < itemInfoVm.pieces.length; i++) {
        var row = table.insertRow(-1);
        row.className = 'item';
        $("<td />").html('<input type="checkbox"/>').appendTo(row);
        var pieceName = row.insertCell(0);
        pieceName.innerHTML = itemInfoVm.pieces[i];
    }
    $("#modifyTable .item td:nth-child(1)").click(function () {
        $(this).toggleClass("highlight");
    });

    // agreement section
    const agreement = getAgreement(itemInfoVm.price, RETURN_LOCATION, PENALTY, FILE_DURATION, LEGAL_NOTICE);
    $('#signature-agreement').html(agreement); 
};

function itemInfoFailureHandler(xhr) {
    console.log("Item info service experienced an error...");
    console.log(xhr.error);
    showServiceError('Item Info', xhr.status);
};

function itemInfoSuccessHandler(data, status, xhr) {
    console.log("Item info service got a response...");
    itemInfo = data && data.items && data.items.length ? data.items[0] : null;
    let foundItemInfo = itemInfo !== null;
    item = foundItemInfo ? item : null;
    let itemVm = createItemVm(item);
    bindItem(itemVm);     
    if(foundItemInfo) {
        let itemInfoVm = createItemInfoVm(itemInfo);
        bindItemInfo(itemInfoVm);
        $("#equipment-info").toggle(true);
        $("#datetime-notice").toggle(false);
        $("#datetime-input").toggle(true);
        $("#signature-notice").toggle(false);
        $("#signature-agreement").toggle(true);
        $("#signature-panel").toggle(true);
        $("#submit").prop('disabled', false);
    }
};

function findItemInfo(item) {
    console.log("Searching for item info with id " + item.id + "...");
    let itemInfoService = HOST + '/iteminfo?limit=30&query=itemid%3D%22' + item.id + '%22';
    $.ajax({
        url: itemInfoService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: itemInfoSuccessHandler,
        error: itemInfoFailureHandler
    });
};

// ITEM
function createItemVm(item) {
    return {
        title: (item || {}).title || 'N/A',
        barcode: (item || {}).barcode || 'N/A'
    };
};

function bindItem(itemVm) {
    $("#Item2").html("Item: " + itemVm.title);
    $("#Item_Barcode2").html("Item Barcode: " + itemVm.barcode);
    $("#equipment-search-result").toggle(true);   
};

function itemFailureHandler(data, status, xhr) {
    console.log("Item service experienced an error...");
    console.log(xhr.error);
    showServiceError('Item', xhr.status);
};

function itemSuccessHandler(data, status, xhr) {
    console.log("Item service got a response...");
    item = data && data.items && data.items.length ? data.items[0] : null;
    let foundItem = item !== null;
    if(foundItem) {
        findItemInfo(item);
    } else {
        let itemVm = createItemVm(item);
        bindItem(itemVm);
    }
};

function findItemByBarcode(barcode) {
    console.log("Searching for item with barcode " + barcode + "...");
    let itemStorageService = HOST + '/item-storage/items?query=(barcode="' + barcode + '")';
    $.ajax({
        url: itemStorageService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: itemSuccessHandler,
        error: itemFailureHandler
    });
};

function onItemBarcodeKeypress(event) {
    if (event.keyCode == 13) {
        event.preventDefault();   
        item = null;     
        itemInfo = null;
        $("#equipment-search-result").toggle(false);
        $("#equipment-info").toggle(false);
        $("#datetime-notice").toggle(true);
        $("#datetime-input").toggle(false);
        $("#signature-notice").toggle(true);
        $("#signature-agreement").toggle(false);
        $("#signature-panel").toggle(false);
        $("#submit").prop('disabled', true);
        let barcode = $('#itemCode').val();
        findItemByBarcode(barcode);
    }
};

// USER
function createUserVm(user) {
    let userVm = {};
    let personal = (user || {}).personal || {};
    userVm['email'] = personal.email || "N/A";
    let firstName = personal.firstName || null;
    let middleName = personal.middleName || "";
    let lastName = personal.lastName || null;
    let isValidFullName = firstName && lastName;
    userVm['fullName'] = isValidFullName ? lastName + ", " + firstName + " " + middleName : "N/A";
    return userVm;
};

function bindUser(userVm) {
    $("#email").html("Patron Email: " + userVm.email);
    $("#fullName").html("Full Patron Name: " + userVm.fullName);
    $("#patron-search-result").toggle(true);
};

function userFailureHandler(xhr) {
    console.log("User service experienced an error...");
    console.log(xhr.error);
    showServiceError('User', xhr.status);
};

function userSuccessHandler(data, status, xhr) {
    console.log("User service got a response...");
    user = data && data.users && data.users.length ? data.users[0] : null;
    let userVm = createUserVm(user);
    bindUser(userVm);
    let foundUser = user !== null;
    $("#equipment-notice").toggle(!foundUser);
    $("#equipment-search").toggle(foundUser);
};

function findUserByBarcode(barcode) {
    console.log("Searching for patron with barcode " + barcode + "...");
    let userService = HOST + '/users?query=(barcode="' + barcode + '")';
    $.ajax({
        url: userService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: userSuccessHandler,
        error: userFailureHandler
    });
};

function onUserBarcodeKeypress(event) {
    if (event.keyCode == 13) {
        event.preventDefault();
        user = null;
        item = null;
        itemInfo = null;
        $("#patron-search-result").toggle(false);
        $("#equipment-notice").toggle(true);
        $("#equipment-search").toggle(false);
        $("#equipment-search-result").toggle(false);
        $("#equipment-info").toggle(false);
        $("#datetime-notice").toggle(true);
        $("#datetime-input").toggle(false);
        $("#signature-notice").toggle(true);
        $("#signature-agreement").toggle(false);
        $("#signature-panel").toggle(false);
        $("#submit").prop('disabled', true);
        let barcode = $('#getName').val();
        findUserByBarcode(barcode);
    }
};

// UI FORM
function initDateTimes() {
    let loanDate = new Date();
    let dueDate = createDate(loanDate, 7);
    let loanDateStr = formatDate(loanDate.getDate(), loanDate.getMonth(), loanDate.getFullYear());
    let loanTimeStr = formatTime(loanDate.getMinutes(), loanDate.getHours());
    let dueDateStr = formatDate(dueDate.getDate(), dueDate.getMonth(), dueDate.getFullYear());
    $('#checkoutdate').val(loanDateStr);
    $('#checkouttime').val(loanTimeStr);
    $('#returndate').val(dueDateStr);
    $('#sig-date').val(loanDateStr);
};

function initEventHandlers() {
    $('#getName').keypress(onUserBarcodeKeypress);
    $('#itemCode').keypress(onItemBarcodeKeypress);
    $('#submit').click(onLoanSubmitClick);
    $("#deletebutton").click(onItemRemoveClick);
};

function toggleForm(enable) {
    $("#getName").prop('disabled', !enable);
    $("#itemCode").prop('disabled', !enable);
    $("#deletebutton").prop('disabled', !enable);
    $("#checkoutdate").prop('disabled', !enable);
    $("#checkouttime").prop('disabled', !enable);
    $("#returndate").prop('disabled', !enable);
    $("#returntime").prop('disabled', !enable);
    $("#sig-date").prop('disabled', !enable);
};

// STAFF LOGIN
function createStaffVm(staff) {
    let staffVm = {};
    let personal = (staff || {}).personal || {};
    let firstName = personal.firstName || null;
    let lastName = personal.lastName || null;
    let isValidFullName = firstName && lastName;
    staffVm['fullName'] = isValidFullName ? lastName + ", " + firstName : "N/A";
    return staffVm;
};

function bindStaff(staffVm) {
    console.log("Printing staff name: " + staffVm.fullName);
    $("#staff").html('Staff Name: ' + staffVm.fullName);
};

function loginSuccessHandler(data, status, xhr) {
    console.log("Login service got a response...");
    OKAPI_HEADERS['X-Okapi-Token'] = xhr.getResponseHeader("X-Okapi-Token");;
    let staff = data && data.user ? data.user : null;
    let staffVm = createStaffVm(staff);
    bindStaff(staffVm);
    initDateTimes();
    initEventHandlers();
    toggleForm(true);
};

function loginFailureHandler(xhr) {
    console.log("Login service experienced an error...");
    console.log(xhr.error);
    showServiceError('Login', xhr.status);
};

function login(username, password) {
    let loginService = HOST + '/bl-users/login?expandPermissions=true&fullPermissions=true';
    $.ajax({
        url: loginService,
        type: 'POST',
        data: JSON.stringify({
            'username': username,
            'password': password
        }),
        cache: false,
        contentType: 'application/json',
        processData: false,
        headers: { 'X-Okapi-Tenant': TENANT },
        success: loginSuccessHandler,
        error: loginFailureHandler
    });
};

// PAGE LOADED
function onPageReady() {
    console.log('Logging in...');
    login(USERNAME, PASSWORD);
};

$(document)
    .ajaxStart($.blockUI)
    .ajaxStop($.unblockUI)
    .ready(onPageReady);
