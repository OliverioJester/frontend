import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import config from '../api/config';

const Monitoring = React.memo(() => {
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null); // State for warning message
    const [rows, setRows] = useState([]); // State for dynamic rows
  
    const formatDate = (dateString) => {
      return dateString.split('T')[0]; // Extracts the date part from the ISO string
    };
  
    // api
    const getApiUrl = useCallback(() => {
      if (window.location.hostname === 'localhost') {
        return config.api.local;
      } else {
        return config.api.remote;
      }
    }, []);
    
    const apiUrl = getApiUrl();

    const deleteAll = () => {
      setRows([]); // Clears the rows
      localStorage.removeItem('rowss'); // Optionally, remove from localStorage
    };

    const handleSearch = useCallback(async (index) => {
      try {
        const response = await axios.get(`${apiUrl}/customer/${rows[index].ROnumber}`);
        const data = response.data;
        // Format the Dateofpurchase field
        if (data.Dateofpurchase) {
          data.Dateofpurchase = formatDate(data.Dateofpurchase);
        }

  
        const updatedRows = rows.map((row, i) => (i === index ? { ...row, ...data } : row));
        setRows(updatedRows);
        localStorage.setItem('rows', JSON.stringify(updatedRows));
        setError(null);
        // Check for warning conditions
        let warningMessage = '';
        if (!data.Mechaniccodename && !data.Actualrepairdone) {
          warningMessage = 'NO MECHANIC ASSIGNED AND NO ACTUAL REPAIR DONE';
        } else if (!data.Mechaniccodename) {
          warningMessage = 'NO MECHANIC ASSIGNED';
        } else if (!data.Actualrepairdone) {
          warningMessage = 'NO ACTUAL REPAIR DONE';
        }
        setWarning(warningMessage);
      } catch (err) {
        setError('Record not found');
        setWarning(null);
        // Do not clear rows; just notify user that the record was not found
        const updatedRows = rows.map((row, i) => (i === index ? { ...row, companyData: null } : row));
        setRows(updatedRows);
        localStorage.setItem('rows', JSON.stringify(updatedRows));
      }
    }, [apiUrl, rows]);
  
    useEffect(() => {
      const savedRows = localStorage.getItem('rows','date');
      if (savedRows) {
        setRows(JSON.parse(savedRows));
      }
    }, []);
  
    const handleExport = useCallback(async () => {
      if (!rows.length) return;
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Company Data');
  
      const headerStyle = {
        font: {
          name: 'Calibri', // Set font to Calibri
          size: 14, // Set font size to 14
          bold: true, // Make font bold
          color: { argb: 'black' } // White font color
        },
        fill: {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF200' }
        },
        alignment: { horizontal: 'center', vertical: 'middle',  wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        },
      };
  
      const cellStyle = {
        font: { size: 12, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center', vertical: 'middle',  wrapText: true },
        border: {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        },
      };
  
      worksheet.columns = [
        { header: 'No.', key: 'index', width: 10 },  
        { header: 'RO.TURN-OVERDATE (DATE ENDORSED).', key: 'ROturn', width: 50 },
        { header: 'DATE OF VALIDATION', key: 'index', width: 30 },
        { header: 'RO Number', key: 'ROnumber', width: 30 },
        { header: 'DOC Number', key: 'DOCNumber', width: 30 },
        { header: 'S.O Number', key: 'AutoIDnumber', width: 30 },
        { header: 'Customer Name', key: 'Companyname', width: 40 },
        { header: 'Contact No.', key: 'Telephone', width: 30 },
        { header: 'DATE OF SERVICE', key: 'Dateofservice', width: 30 },
        { header: 'DATE COMPLETED', key: 'Dateofcompleted', width: 30 },
        { header: 'Location', key: 'Address', width: 50 },
        { header: 'Region', key: 'Region', width: 20 },
        { header: 'Unit/Model', key: 'Model', width: 50 },
        { header: 'VIN./ CHASSIS NO', key: 'Vinchassisno', width: 50 },
        { header: 'ENGINE NO', key: 'ROengineno', width: 50 },
        { header: 'SO CONCERN', key: 'Remarksnote', width: 50 },
        { header: 'DATE PURCHASE', key: 'Dateofpurchase', width: 40 },
        { header: 'UW/FOC/CH/CL', key: 'chargerwarranty', width: 30 },
        { header: 'MECHANIC ASSIGNED', key: 'Mechaniccodename', width: 50 },
        { header: 'SERVICE ADVISOR', key: 'Serviceentry', width: 50 },
        { header: 'REMARKS (Actual repair done)', key: 'Actualrepairdone', width: 50 },
        { header: 'VOC  (Voice of the Customer)', key: 'Voc', width: 60 },
        { header: 'STATUS', key: 'Status', width: 40 },
        { header: 'FOLLOW UP', key: 'Followup', width: 40 }
        
      ];
  
      // Apply header styles
      worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
        cell.style = headerStyle;
      });
  
      // Add data rows
      rows.forEach((row) => worksheet.addRow(row));
  
      // Apply cell styles
      worksheet.eachRow({ includeEmpty: true }, (row) => {
        if (row.number > 1) { // Skip header row
          row.eachCell({ includeEmpty: true }, (cell) => {
            cell.style = cellStyle;
          });
        }
      });
  
      // Set the page orientation to portrait
      worksheet.pageSetup = {
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };
  
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      saveAs(blob, 'CompanyData.xlsx');
    }, [rows]);
  
    const handleAddRow = useCallback(() => {
      const newRow = {
        ROnumber: '',
        DOCNumber: '',
        AutoIDnumber: '',
        Companyname: '',
        Telephone: '',
        Dateofservice: '',
        Datecompleted: '',
        Address: '',
        Model: '',
        Vinchassisno: '',
        ROengineno: '',
        Remarksnote: '',
        Dateofpurchase: '',
        Mechaniccodename: '',
        Serviceentry: '',
        Actualrepairdone: ''
      };
      const updatedRows = [...rows, newRow];
      setRows(updatedRows);
      localStorage.setItem('rows', JSON.stringify(updatedRows));
    }, [rows]);
  
    const handleDeleteRow = useCallback((index) => {
      const updatedRows = rows.filter((_, i) => i !== index);
      setRows(updatedRows);
      localStorage.setItem('rows', JSON.stringify(updatedRows)); //delete the data on local storage
    }, [rows]);
  
  
    const handleRowChange = useCallback((index, key, value) => {
      const updatedRows = rows.map((row, i) => (
        i === index ? { ...row, [key]: value } : row
      ));
      setRows(updatedRows);
      localStorage.setItem('rows', JSON.stringify(updatedRows));
    }, [rows]);
  
    return (
      <div className="App">
        <h1>Search Company by ROnumber Prototype1</h1>
        {error && <p>{error}</p>}
        <button className='export' onClick={handleExport} disabled={!rows.length}>Export to Excel</button>
        <div>
          <h2>Monitoring</h2>
          {warning && <h1 style={{ color: 'red', fontWeight: 'bold', textAlign: 'center' }}>{warning}</h1>} {/* Display warning */}

          <button onClick={deleteAll} className='deleteall'>Delete All</button>

          <table >
            <thead>
              <tr>
                <th>No.</th>
                <th>RO.TURN-OVER DATE(DATE ENDORSED)</th>
                <th>DATE OF VALIDATION</th>
                <th>R.O NO.</th>
                <th>DOC NO.</th>
                <th>S.O NO.</th>
                <th>CUSTOMER NAME</th>
                <th>CONTACT NO.</th>
                <th>DATE OF SERVICE</th>
                <th>DATE COMPLETED</th>
                <th>LOCATION</th>
                <th>REGION</th>
                <th>UNIT/MODEL</th>
                <th>VIN./CHASSIS NO.</th>
                <th>ENGINE NO</th>
                <th>SO CONCERN</th>
                <th>DATE PURCHASE</th>
                <th>MECHANIC ASSIGNED</th>
                <th>SERVICE ADVISOR</th>
                <th>REMARKS (Actual repair done)</th>
                <th>VOC (Voice of the customer)</th>
                <th>STATUS</th>
                <th>FOLLOW UP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                
                <tr key={index}  className='table'>
                  <td>{index + 1}{row.index}</td>
                  <td></td>
                  <td></td>
                  <td>
                    <input
                      type="text"
                      value={row.ROnumber}
                      onChange={(e) => handleRowChange(index, 'ROnumber', e.target.value)}
                      placeholder="Enter ROnumber"
                    />
                    <button className='search' onClick={() => handleSearch(index)}>Search</button>
                      <br />
                    <button onClick={() => handleDeleteRow(index)}>Delete</button>
                  </td>
                  <td><input type="text" value={row.DOCNumber} onChange={(e) => handleRowChange(index, 'DOCNumber', e.target.value)}  /></td>
                  <td>{row.AutoIDnumber}</td>
                  <td>{row.Companyname}</td>
                  <td>{row.Telephone}</td>
                  <td><input type="date" value={row.Dateofservice} onChange={(e) => handleRowChange(index, 'Dateofservice', e.target.value)}  /></td>
                  <td><input type="date"  value={row.Dateofcompleted} onChange={(e) => handleRowChange(index, 'Dateofcompleted', e.target.value)}/></td>
                  <td>{row.Address}</td>
                  <td></td>
                  <td>{row.Model}</td>
                  <td>{row.Vinchassisno}</td>
                  <td>{row.ROengineno}</td>
                  <td>{row.Remarksnote}</td>
                  <td>{row.Dateofpurchase}</td>
                  <td>{row.chargerwarranty}</td>
                  <td>{row.Mechaniccodename || '*No mechanic assigned*'}</td>
                  <td>{row.Serviceentry}</td>
                  <td>{row.Actualrepairdone || '*No actual repair done*'}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
     
              ))}
            </tbody>
          </table>
          <div className='add-row'>
            <button className='' onClick={handleAddRow}>Add Row</button>
          </div>
        </div>
      </div>
  )
});

export default Monitoring