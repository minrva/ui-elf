// FOLIO settings
const USERNAME = 'diku_admin';
const PASSWORD = 'admin';
const TENANT = 'diku';
const HOST = 'http://localhost:9130';

// agreement settings
const PENALTY = "12,25 €/day";
const FILE_DURATION = "6 months";
const LEGAL_NOTICE = "<p>Notice: <i>Warning of Copyright Restrictions. The copyright law of the United States (title 17, United States Code) governs the reproduction, distribution, adaptation, public performance, and public display of copyrighted material. A person who uses technology to make an unauthorized copy of copyrighted material may be liable for copyright infringement unless they have a valid justification for making the copy, such as fair use.</i></p>";
const RETURN_LOCATION = "Datalogisk Institut Loanable Technology Desk";

// templates
const CHECKIN_AGREEMENT_TEMPLATE = "<p>The replacement value of this item is placed at <b>@@PRICE@@</b>. The equipment "
    + "will not be discharged until all items are inspected and accounted for by a staff member. "
    + "If a piece in the bag is missing "
    + "or damaged, the item will not be discharged from the patron’s account until the situation "
    + "is resolved. The borrower is responsible for replacing any pieces damaged or missing during "
    + "the loan period, regardless of whether the item has been discharged from the borrower’s library "
    + "account. The library is not responsible for any damage that may occur to equipment while "
    + "in possession of the borrower. Overdue fines of <b>@@PENALTY@@</b> may apply if the item is returned "
    + "after the due date and time.</p>";
const CHECKOUT_AGREEMENT_TEMPLATE = "<p>The replacement value of this item is placed at <b>@@PRICE@@</b>. " 
    + "The borrower is responsible for replacing any pieces damaged or missing during the loan period. "
    + "The library is not responsible for any damage that may occur to equipment while in possession of the borrower. "
    + "By signing, borrower agrees that all pieces listed in the above contents are here upon check out. "
    + "The item must be returned to the <b>@@LOCATION@@</b> "
    + "and cannot be returned to a different library or via a book drop box. "
    + "Upon return, the return portion of this contract must be signed by the borrower and the staff member. "
    + "Overdue fines of <b>@@PENALTY@@</b> begin accruing immediately after the due date. "
    + "This form will be kept on file for <b>@@FILE_DURATION@@</b>.</p>"
    + "@@LEGAL_NOTICE@@";
