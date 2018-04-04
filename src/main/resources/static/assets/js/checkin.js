// okapi headers
let OKAPI_HEADERS = {
    'X-Okapi-Tenant': TENANT,
    'X-Okapi-Token': null
};

// business objects
let savedEmail = null;
let savedItemName = null;
let savedItemId = null;
let savedUID = null;
let today = null;

$(function () {
    $('input[type="text"][value="today"]').each(function () {
        var c = new Date();
        var nextWeek = new Date(c);
        nextWeek.setDate(c.getDate());
        var m;
        m = nextWeek.getMonth() + 1;
        var d;
        d = nextWeek.getDate();
        var y;
        y = nextWeek.getFullYear();
        today = m + '/' + d + '/' + y;
        $(this).attr({
            'value': m + '/' + d + '/' + y
        });
    });
});

// util
function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

function formatDate(dd, mm, yyyy) {
    mm = mm + 1;
    if (mm < 10) mm = '0' + mm;
    if (dd < 10) dd = '0' + dd;
    return mm + '/' + dd + '/' + yyyy;
};

function formatDateObj(date) {
    return formatDate(date.getDate(), date.getMonth(), date.getFullYear());
};

function formatTime(mm, hh) {
    if (hh < 10) hh = '0' + hh;
    if (mm < 10) mm = '0' + mm;
    return hh + ':' + mm;
};

function formatTimeObj(date) {
    return formatTime(date.getMinutes(), date.getHours());
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

// EMAIL
function createEmail(itemId, emailAddress, itemTitle) {
    let email = {};
    email['id'] = uuidv4();
    email['itemid'] = itemId;
    email['email'] = emailAddress;
    email['itemname'] = itemTitle;
    return email;
};

function emailSuccessHandler(data, status, xhr) {
    console.log("Email return service responded...");
    window.location.href = 'index.html';
};

function emailFailureHandler(data, status, xhr) {
    console.log("Email return service experienced an error...");
    console.log(xhr.error);
    showServiceError('Email Return', xhr.status);
};

function postEmail(email) {
    console.log(email);
    console.log("Starting to send email");
    let pdf = new jsPDF('p', 'pt', 'legal');
    pdf.addHTML(document.body, function () {
        email['pdf'] = pdf.output('dataurlstring');
        let emailerService = HOST + '/emailreturn';
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
        });
    });
};

// LOAN CHECKIN
function createLoanCheckin(loan) {
    let loanCheckin = {};
    loanCheckin['id'] = loan.id;
    loanCheckin['action'] = 'checkedin';
    loanCheckin['dueDate'] = loan.dueDate;
    loanCheckin['itemId'] = loan.itemId;
    loanCheckin['loanDate'] = loan.loanDate;
    loanCheckin['returnDate'] = loan.dueDate;
    loanCheckin['userId'] = loan.userId;
    loanCheckin['item'] = {};
    loanCheckin['item']['title'] = loan.item.title;
    loanCheckin['item']['barcode'] = loan.item.barcode;
    loanCheckin['item']['location'] = {};
    loanCheckin['item']['location']['name'] = loan.item.location.name;
    loanCheckin['item']['status'] = {};
    loanCheckin['item']['status']['name'] = loan.item.status.name;
    loanCheckin['metaData'] = {};
    loanCheckin['metaData']['createdByUserId'] = loan.metaData.createdByUserId;
    loanCheckin['metaData']['createdDate'] = loan.metaData.createdDate;
    loanCheckin['metaData']['updatedByUserId'] = loan.metaData.createdByUserId;
    loanCheckin['metaData']['updatedDate'] = new Date()
    loanCheckin['status'] = {};
    loanCheckin['status']['name'] = 'Closed';
    return loanCheckin;
};

function putCheckinFailureHandler(data, status, xhr) {
    console.log("Circulation service experienced an error...");
    console.log(xhr.error);
    showServiceError('Circulation', xhr.status);
};

function putCheckinSuccessHandler(data, status, xhr) {
    console.log("Circulation service responded...");
    const itemId = savedUID;
    const emailAddress = savedEmail;
    const itemTitle = savedItemName;
    let email = createEmail(itemId, emailAddress, itemTitle);
    postEmail(email);
};

function putLoanCheckin(loanCheckin) {
    console.log("Checking in loan with id " + loanCheckin.id + "...");
    let circulationService = HOST + '/circulation/loans/' + loanCheckin.id;
    $.ajax({
        url: circulationService,
        type: 'PUT',
        data: JSON.stringify(loanCheckin),
        cache: false,
        contentType: 'application/json',
        processData: false,
        headers: OKAPI_HEADERS,
        success: putCheckinSuccessHandler,
        error: putCheckinFailureHandler
    });
}

// GET LOAN FOR CHECKIN (on submit)
function getLoanFailureHandler(data, status, xhr) {
    console.log("Circulation service experienced an error...");
    console.log(xhr.error);
    showServiceError('Circulation', xhr.status);
};

function getLoanSuccessHandler(data, status, xhr) {
    console.log("Circulation service responded...");
    let loan = data && data.loans && data.loans.length ? data.loans[0] : {};
    let loanCheckin = createLoanCheckin(loan);
    putLoanCheckin(loanCheckin);
};

function findLoanByItemId(itemId) {
    console.log("Searching for loan with id " + itemId + "...");
    let circulationService = HOST + '/circulation/loans?query=(itemId=' + itemId + ' AND status="Open")';
    $.ajax({
        url: circulationService,
        type: 'GET',
        cache: false,
        contentType: 'application/json',
        processData: false,
        headers: OKAPI_HEADERS,
        success: getLoanSuccessHandler,
        error: getLoanFailureHandler
    });
};

function onCheckinSubmit() {
    const itemId = savedItemId;
    findLoanByItemId(itemId);
};

// PRICE
function getAgreement(price, penalty) {
    let agreement = CHECKIN_AGREEMENT_TEMPLATE;
    agreement = agreement.replace(/@@PRICE@@/g, price);
    agreement = agreement.replace(/@@PENALTY@@/g, penalty);
    return agreement;
}

function bindLoanInfo(loanInfoVm) {
    $('#equipment-loans').hide();
    $("#accordion2").empty();
    $('#loan-id').text("Loan '" + loanInfoVm.loanId + "'");
    $('#Item2').text("Item: " + loanInfoVm.itemTitle);
    $('#Item_Barcode2').text("Item Barcode: " + loanInfoVm.itemBarcode);
    $('#Total_pieces2').text("Total parts: " + loanInfoVm.pieces.length);
    $('#modifyTable').empty();
    let table = document.getElementById("modifyTable");
    for (let i = 0; i < loanInfoVm.pieces.length; i++) {
        let row = table.insertRow(-1);
        let pieceName = row.insertCell(0);
        pieceName.innerHTML = loanInfoVm.pieces[i];
    }
    $("#modifyTable tr td:first-child").click(function () {
        $(this).toggleClass("highlight");
    });
    $('#item-info').show();
    const agreement = getAgreement(loanInfoVm.price, PENALTY);
    $('#block2').html(agreement);
    $('#signature-panel').show();
    $("#submit").prop('disabled', false);
};

function priceFailureHandler(data, status, xhr) {
    console.log("ItemInfo service experienced an error...");
    console.log(xhr.error);
    showServiceError('ItemInfo', xhr.status);
};

function priceSuccessHandler(loanInfoVm, data, status, xhr) {
    console.log("ItemInfo service responded...");
    loanInfoVm['price'] = data && data.items && data.items.length && data.items[0].price ? 
        data.items[0].price : '';
    savedUID = loanInfoVm.piecesId;
    savedItemName = loanInfoVm.itemTitle;
    savedItemId = loanInfoVm.itemId;
    bindLoanInfo(loanInfoVm);
};

function findPriceByItemId(loanInfoVm) {
    console.log("Searching for price of item with id " + loanInfoVm['itemId'] + "...");
    let itemInfoService = HOST + '/iteminfo?limit=30&query=itemid%3D%22' + loanInfoVm['itemId'] + '%22';
    $.ajax({
        url: itemInfoService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: function (data, status, xhr) {
            priceSuccessHandler(loanInfoVm, data, status, xhr);
        },
        error: priceFailureHandler
    });
};

// PIECES
function piecesFailureHandler(xhr) {
    console.log("Pieces service experienced an error...");
    console.log(xhr.error);
    showServiceError('Emailer', xhr.status);
};

function piecesSuccessHandler(loanInfoVm, data, status, xhr) {
    console.log("Pieces service responded...");
    loanInfoVm['piecesId'] = data && data.id ? data.id : '';
    loanInfoVm['pieces'] = data && data.piece_list ? data.piece_list : [];
    findPriceByItemId(loanInfoVm);
};

function findPiecesByItemId(loanId, itemName, itemBarcode, itemId) {
    console.log("Searching for pieces for item with id " + itemId + "...");
    let loanInfoVm = {
        loanId: loanId,
        itemId: itemId,
        itemBarcode: itemBarcode,
        itemTitle: itemName
    };
    let piecesService = HOST + '/emailer/' + itemId;
    $.ajax({
        url: piecesService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: function (data, status, xhr) {
            piecesSuccessHandler(loanInfoVm, data, status, xhr);
        },
        error: piecesFailureHandler
    });
};

// LOANS
const LOAN_TEMPLATE = ""
    + "<div class='accordion-group'>"
    + "<div class='accordion-heading'>"
    + "<a class='accordion-toggle' data-toggle='collapse' data-parent='#accordion2' href='#@@LOAN_ID@@'>"
    + "@@ITEM_TITLE@@ (@@LOAN_ID@@)</a>"
    + "</div>"
    + "<div id='@@LOAN_ID@@' class='accordion-body collapse'>"
    + "<div class='accordion-inner'>"
    + "<p class='acc-item-info'>"
    + "Loan ID: @@LOAN_ID@@ <br/>"
    + "Checkout Date: @@CHECKOUT_DATE@@, @@CHECKOUT_TIME@@<br/>"
    + "Due Date: @@RETURN_DATE@@, @@RETURN_TIME@@<br/>"
    + "Barcode: @@ITEM_BARCODE@@<br/>"
    + "</p>"
    + "<input id='selectedrenewal' value='Select' "
    + "onclick=\"outdate_original = '@@CHECKOUT_DATE@@'; "
    + "outtime_original = '@@CHECKOUT_TIME@@'; "
    + "returndate_original = '@@RETURN_DATE@@'; "
    + "returntime_original = '@@RETURN_TIME@@'; "
    + "findPiecesByItemId('@@LOAN_ID@@', '@@ITEM_TITLE@@', '@@ITEM_BARCODE@@', '@@ITEM_ID@@');\"  "
    + "type='button' class='pull-right btn btn-primary acc-item-info-btn' data-loading-text='Loading...'/>" +
    "</div></div></div>";

function getLoanView(loanVm) {
    let loanView = LOAN_TEMPLATE;
    loanView = loanView.replace(/@@LOAN_ID@@/g, loanVm.loanId);
    loanView = loanView.replace(/@@ITEM_ID@@/g, loanVm.itemId);
    loanView = loanView.replace(/@@ITEM_TITLE@@/g, loanVm.itemTitle);
    loanView = loanView.replace(/@@ITEM_BARCODE@@/g, loanVm.itemBarcode);
    loanView = loanView.replace(/@@CHECKOUT_DATE@@/g, loanVm.checkoutDate);
    loanView = loanView.replace(/@@CHECKOUT_TIME@@/g, loanVm.checkoutTime);
    loanView = loanView.replace(/@@RETURN_DATE@@/g, loanVm.returnDate);
    loanView = loanView.replace(/@@RETURN_TIME@@/g, loanVm.returnTime);
    return loanView;
};

function createLoanVm(loan) {
    const loanDate = new Date(loan.loanDate);
    const dueDate = new Date(loan.dueDate);
    let loanVm = {};
    loanVm['loanId'] = loan.id;
    loanVm['itemId'] = loan.itemId;
    loanVm['itemTitle'] = loan.item.title;
    loanVm['itemBarcode'] = loan.item.barcode;
    loanVm['checkoutDate'] = formatDateObj(loanDate);
    loanVm['checkoutTime'] = formatTimeObj(loanDate);
    loanVm['returnDate'] = formatDateObj(dueDate);
    loanVm['returnTime'] = formatTimeObj(dueDate);
    return loanVm;
};

function bindLoans(loans) {
    let loans_container = $("#accordion2");
    loans_container.empty();
    for (i = 0; i < loans.length; i++) {
        let loanVm = createLoanVm(loans[i]);
        let loanView = getLoanView(loanVm);
        loans_container.append(loanView);
    }
    if(loans.length === 0) {
        loans_container.append('0 outstanding loans found.');
    }
    $('#equipment-loans').show();
};

function loansFailureHandler(xhr) {
    console.log("Loan service experienced an error...");
    console.log(xhr.error);
    showServiceError('Loan', xhr.status);
};

function loansSuccessHandler(data, status, xhr) {
    console.log("Loan service responded...");
    let isValidLoans = data && data.loans && data.loans.length;
    let loans = isValidLoans ? data.loans : [];
    bindLoans(loans);
};

function findLoansByUserId(userId) {
    console.log("Searching for loans for user with id " + userId + "...");
    let circulationService = HOST + '/circulation/loans?query=(userId="' + userId + '" AND status="Open")';
    $.ajax({
        url: circulationService,
        type: 'GET',
        dataType: 'json',
        headers: OKAPI_HEADERS,
        success: loansSuccessHandler,
        error: loansFailureHandler
    });
};

// USER
function createUserVm(user) {
    let userVm = {};
    let personal = (user || {}).personal || {};
    userVm['email'] = personal.email || "N/A";
    savedEmail = userVm.email;
    let firstName = personal.firstName || null;
    let middleName = personal.middleName || "";
    let lastName = personal.lastName || null;
    let isValidFullName = firstName && lastName;
    userVm['fullName'] = isValidFullName ? lastName + ", " + firstName + " " + middleName : "N/A";
    return userVm;
};

function bindUser(user) {
    let userVm = createUserVm(user);
    $("#email").html("Patron Email: " + userVm.email);
    $("#fullName").html("Full Patron Name: " + userVm.fullName);
    $("#patron-search-result").show();
};

function userSuccessHandler(data, status, xhr) {
    console.log("User service got a response...");
    let isValidUser = data && data.users && data.users.length;
    user = isValidUser ? data.users[0] : null;
    bindUser(user);
    if(user) {
        $("#equipment-notice").hide();
        findLoansByUserId(user.id);
    }
};

function userFailureHandler(xhr) {
    console.log("User service experienced an error...");
    console.log(xhr.error);
    showServiceError('User', xhr.status);
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
        let bcode = document.getElementById("getName").value;
        findUserByBarcode(bcode);
    }
};

// FORM UI
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
    $('#submit').click(onCheckinSubmit);
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

function bindStaff(staff) {
    let staffVm = createStaffVm(staff);
    console.log("Printing staff name: " + staffVm.fullName);
    $("#staff").html('Staff Name: ' + staffVm.fullName);
};

function loginSuccessHandler(data, status, xhr) {
    console.log("Login service got a response...");
    OKAPI_HEADERS['X-Okapi-Token'] = xhr.getResponseHeader("X-Okapi-Token");;
    let isValidStaff = data && data.user;
    staff = isValidStaff ? data.user : null;
    bindStaff(staff);
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
