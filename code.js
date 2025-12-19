
/**
 * Google Apps Script Code - Enhanced with Dynamic Column Detection and Specific Feedback
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

/**
 * Maps headers to indices for robust data retrieval
 */
function getHeaderMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    const h = String(header).toLowerCase().trim();
    if (h.includes("hrms id") || h.includes("id")) map.hrmsId = index;
    if (h.includes("employee name") || h.includes("name")) map.employeeName = index;
    if (h.includes("कर्मचारी") || h.includes("hindi name")) map.hindiName = index;
    if (h.includes("designation")) map.designation = index;
    if (h.includes("dob") || h.includes("date of birth")) map.dob = index;
    if (h.includes("posting office") || h.includes("office")) map.postingOffice = index;
    if (h.includes("udise code") || h.includes("udise")) map.udiseCode = index;
    if (h.includes("adhar")) map.adharNumber = index;
    if (h.includes("epic")) map.epicNumber = index;
    if (h.includes("pan")) map.panNumber = index;
    if (h.includes("mobile")) map.mobileNumber = index;
    if (h.includes("gmail") || h.includes("email")) map.gmailId = index;
    if (h.includes("photo")) map.photo = index;
  });
  return map;
}

function handleLogin(hrmsId, password, sheetData, sheetList) {
  const hrmsIdStr = String(hrmsId).trim();
  const passwordStr = String(password).trim(); 

  const listMap = getHeaderMap(sheetList);
  const listValues = sheetList.getDataRange().getValues();
  let listRow = null;

  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][listMap.hrmsId]).trim() === hrmsIdStr) {
      listRow = listValues[i];
      break;
    }
  }

  if (!listRow) {
    throw new Error("HRMS ID not found in Master List.");
  }

  const listDob = formatDate(listRow[listMap.dob]);
  if (listDob !== passwordStr) {
    throw new Error("Invalid Password. Date of Birth mismatch.");
  }

  const masterInfo = {
    hrmsId: String(listRow[listMap.hrmsId] || "").trim(),
    employeeName: String(listRow[listMap.employeeName] || "").trim(),
    hindiName: String(listRow[listMap.hindiName] || "").trim(),
    designation: String(listRow[listMap.designation] || "").trim(),
    dob: listDob,
    postingOffice: String(listRow[listMap.postingOffice] || "").trim(),
    udiseCode: String(listRow[listMap.udiseCode] || "").trim()
  };

  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId || 0]).trim() === hrmsIdStr) {
      const row = dataValues[i];
      return createSuccessResponse({
        exists: true,
        source: "Data",
        data: {
          ...masterInfo,
          adharNumber: String(row[dataMap.adharNumber] || "").trim(),
          epicNumber: String(row[dataMap.epicNumber] || "").trim(),
          panNumber: String(row[dataMap.panNumber] || "").trim(),
          mobileNumber: String(row[dataMap.mobileNumber] || "").trim(),
          gmailId: String(row[dataMap.gmailId] || "").trim(),
          photo: String(row[dataMap.photo] || "")
        }
      });
    }
  }

  return createSuccessResponse({
    exists: false,
    source: "List",
    data: {
      ...masterInfo,
      adharNumber: "",
      epicNumber: "",
      panNumber: "",
      mobileNumber: "",
      gmailId: "",
      photo: ""
    }
  });
}

function handleSave(data, sheetData, sheetList) {
  const hrmsIdStr = String(data.hrmsId).trim();
  const dataMap = getHeaderMap(sheetData);
  const dataValues = sheetData.getDataRange().getValues();
  let rowIndex = -1;

  for (let i = 1; i < dataValues.length; i++) {
    if (String(dataValues[i][dataMap.hrmsId || 0]).trim() === hrmsIdStr) {
      rowIndex = i + 1;
      break;
    }
  }

  const rowData = new Array(13).fill("");
  rowData[0] = "'" + data.hrmsId;
  rowData[1] = data.employeeName;
  rowData[2] = data.hindiName;
  rowData[3] = data.designation;
  rowData[4] = data.dob;
  rowData[5] = data.postingOffice;
  rowData[6] = data.udiseCode;
  rowData[7] = "'" + data.adharNumber;
  rowData[8] = data.epicNumber;
  rowData[9] = data.panNumber;
  rowData[10] = "'" + data.mobileNumber;
  rowData[11] = data.gmailId;
  rowData[12] = data.photo || "";

  let statusMsg = "";
  if (rowIndex !== -1) {
    sheetData.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
    statusMsg = "Data Updated Successfully!";
  } else {
    sheetData.appendRow(rowData);
    statusMsg = "Data Saved Successfully!";
  }

  // Update master list with Hindi name
  const listMap = getHeaderMap(sheetList);
  const listValues = sheetList.getDataRange().getValues();
  for (let i = 1; i < listValues.length; i++) {
    if (String(listValues[i][listMap.hrmsId]).trim() === hrmsIdStr) {
      sheetList.getRange(i + 1, (listMap.hindiName || 2) + 1).setValue(data.hindiName);
      break;
    }
  }

  return createSuccessResponse({ message: statusMsg });
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
