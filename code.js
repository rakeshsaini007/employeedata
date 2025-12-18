/**
 * Google Apps Script Code
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste this code into Code.gs.
 * 4. Click Deploy > New Deployment.
 * 5. Select type: "Web app".
 * 6. Description: "v3 - Sync Hindi Name to List".
 * 7. Execute as: "Me".
 * 8. Who has access: "Anyone".
 * 9. Click Deploy.
 * 10. Copy the "Web app URL" and paste it into `constants.ts` in the React app.
 */

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheetData = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
    const sheetList = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("List");

    if (!sheetData || !sheetList) {
      throw new Error("Required sheets 'Data' or 'List' are missing.");
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    if (action === "login") {
      return handleLogin(payload.hrmsId, payload.password, sheetData, sheetList);
    } else if (action === "save") {
      return handleSave(payload.data, sheetData, sheetList);
    } else {
      throw new Error("Invalid action");
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function handleLogin(hrmsId, password, sheetData, sheetList) {
  const hrmsIdStr = String(hrmsId).trim();
  const passwordStr = String(password).trim(); // Expected format: DD-MM-YYYY

  // 1. Verify Credentials in 'List' sheet
  // Headers: HRMS ID, Employee Name, Hindi Name, Designation, DOB
  const listValues = sheetList.getDataRange().getValues();
  let listRow = null;

  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][0]).trim() === hrmsIdStr) {
      listRow = listValues[i];
      break;
    }
  }

  if (!listRow) {
    throw new Error("User ID (HRMS) not found.");
  }

  const listDob = formatDate(listRow[4]);
  if (listDob !== passwordStr) {
    throw new Error("Invalid Password. Date of Birth mismatch.");
  }

  // 2. Credentials Valid. Check 'Data' sheet for existing record.
  // Headers: HRMS ID, Name, Hindi Name, Designation, DOB, Adhar, Epic, PAN, Mobile, Gmail
  const dataValues = sheetData.getDataRange().getValues();
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][0]).trim() === hrmsIdStr) {
      const row = dataValues[i];
      return createSuccessResponse({
        exists: true,
        source: "Data",
        data: {
          hrmsId: row[0],
          employeeName: row[1],
          hindiName: row[2],
          designation: row[3],
          dob: formatDate(row[4]),
          adharNumber: row[5],
          epicNumber: row[6],
          panNumber: row[7],
          mobileNumber: row[8],
          gmailId: row[9]
        }
      });
    }
  }

  // 3. Not in Data, return List info
  return createSuccessResponse({
    exists: false,
    source: "List",
    data: {
      hrmsId: listRow[0],
      employeeName: listRow[1],
      hindiName: listRow[2],
      designation: listRow[3],
      dob: formatDate(listRow[4]),
      adharNumber: "",
      epicNumber: "",
      panNumber: "",
      mobileNumber: "",
      gmailId: ""
    }
  });
}

function handleSave(data, sheetData, sheetList) {
  const hrmsIdStr = String(data.hrmsId).trim();
  const dataValues = sheetData.getDataRange().getValues();
  let rowIndex = -1;

  // 1. Update/Append to 'Data' sheet
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][0]).trim() === hrmsIdStr) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }

  const rowData = [
    "'" + data.hrmsId, // Force string to prevent scientific notation
    data.employeeName,
    data.hindiName,
    data.designation,
    data.dob,
    "'" + data.adharNumber, // Force string for Adhar
    data.epicNumber,
    data.panNumber,
    "'" + data.mobileNumber, // Force string for Mobile
    data.gmailId
  ];

  if (rowIndex !== -1) {
    sheetData.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheetData.appendRow(rowData);
  }

  // 2. Sync Hindi Name back to 'List' sheet automatically
  const listValues = sheetList.getDataRange().getValues();
  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][0]).trim() === hrmsIdStr) {
      // Column index 3 is 'Hindi Name' in the List sheet (headers: ID, Name, Hindi, Design, DOB)
      sheetList.getRange(i + 1, 3).setValue(data.hindiName);
      break;
    }
  }

  return createSuccessResponse({ message: "Record synchronized successfully!" });
}

function createSuccessResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    ...payload
  })).setMimeType(ContentService.MimeType.JSON);
}

function formatDate(date) {
  if (!date) return "";
  if (date instanceof Date) {
     return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd-MM-yyyy");
  }
  return String(date);
}