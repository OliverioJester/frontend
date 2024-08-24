import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import config from '../api/config';


const Pending = () => {
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]); // State for dynamic rows

  const formatDate = (dateString) => {
    return dateString.split('T')[0]; // Extracts the date part from the ISO string
  };


    // api
    const getApiUrl = () => {
      if (window.location.hostname === 'localhost') {
        return config.api.local;
      } else {
        return config.api.remote;
      }
    };
    
    const apiUrl = getApiUrl();

  const handleSearch = async (index) => {
    try {
      const response = await axios.get(`${apiUrl}/pending/${rows[index].AutoIDnumber}`);
      const data = response.data;
      // Format the Dateofpurchase field
      if (data.Dateofpurchase) {
        data.Dateofpurchase = formatDate(data.Dateofpurchase);
      }

      const updatedRows = rows.map((row, i) => (i === index ? { ...row, ...data } : row));
      setRows(updatedRows);
      localStorage.setItem('rowss', JSON.stringify(updatedRows));
      setError(null);
    } catch (err) {
      setError('Record not found');
  
      // Do not clear rows; just notify user that the record was not found
      const updatedRows = rows.map((row, i) => (i === index ? { ...row, companyData: null } : row));
      setRows(updatedRows);
      localStorage.setItem('rowss', JSON.stringify(updatedRows));
    }
  };

  useEffect(() => {
    const savedRows = localStorage.getItem('rowss','date');
    if (savedRows) {
      setRows(JSON.parse(savedRows));
    }
  }, []);

  const handleExport = async () => {
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
      { header: 'S.O Number', key: 'AutoIDnumber', width: 30 },
      { header: 'Customer Name', key: 'Companyname', width: 40 },
      { header: 'RO Number', key: 'ROnumber', width: 30 },
      { header: 'DOC Number', key: 'DOCNumber', width: 30 },
     
      { header: 'Location', key: 'Address', width: 50 },
      { header: 'Unit/Model', key: 'Model', width: 50 },
      { header: 'VIN./ CHASSIS NO', key: 'Vinchassisno', width: 50 },
      { header: 'DATE PURCHASE', key: 'Dateofpurchase', width: 40 },
      { header: 'SO CONCERN', key: 'Remarksnote', width: 50 },
      { header: 'SERVICE ADVISOR', key: 'Serviceentry', width: 50 },
      { header: 'REMARKS (Actual repair done)', key: 'Actualrepairdone', width: 50 },
      { header: 'STATUS', key: 'Status', width: 40 },
      
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
  };

  const handleAddRow = () => {
    const newRow = {
      ROnumber: '',
      DOCNumber: '',
      AutoIDnumber: '',
      Companyname: '',
      Address: '',
      Model: '',
      Vinchassisno: '',
      Remarksnote: '',
      Dateofpurchase: '',
      Serviceentry: '',
    };
    const updatedRows = [...rows, newRow];
    setRows(updatedRows);
    localStorage.setItem('rowss', JSON.stringify(updatedRows));
  };

  const handleDeleteRow = (index) => {
    const updatedRows = rows.filter((_, i) => i !== index);
    setRows(updatedRows);
    localStorage.setItem('rowss', JSON.stringify(updatedRows)); //delete the data on local storage
  };


  const handleRowChange = (index, key, value) => {
    const updatedRows = rows.map((row, i) => (
      i === index ? { ...row, [key]: value } : row
    ));
    setRows(updatedRows);
    localStorage.setItem('rowss', JSON.stringify(updatedRows));
  };


  const deleteAll = () => {
    setRows([]); // Clears the rows
    localStorage.removeItem('rowss'); // Optionally, remove from localStorage
  };

  return (
    <div className="App">
      <h1>Search Company by ROnumber Prototype1</h1>
      {error && <p>{error}</p>}
      <button className='export' onClick={handleExport} disabled={!rows.length}>Export to Excel</button>
      <button onClick={deleteAll} className='deleteall'>Delete All</button>
      <div>
        <h2>Pending</h2>
        <table >
          <thead>
            <tr>
              <th>NO.</th>
              <th>SO #</th>
              <th>Account Name</th>
              <th>RO #</th>
              <th>DOC #</th>
              <th>Location</th>
              <th>UNIT/MODEL</th>
              <th>CHASSIS</th>
              <th>DATE PURCHASE</th>
              <th>SO CONCERN</th>
              <th>SERVICE ADVISOR</th>
              <th>REMARKS</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}  className='table'>
                <td>{index + 1}{row.index}</td>
          
                <td>
                  <input
                      type="text"
                      value={row.AutoIDnumber}
                      onChange={(e) => handleRowChange(index, 'AutoIDnumber', e.target.value)}
                      placeholder="Enter SO"
                    />
                    <button className='search' onClick={() => handleSearch(index)}>Search</button>
                      <br />
                    <button onClick={() => handleDeleteRow(index)}>Delete</button>                  
                </td>
                <td>{row.Companyname}</td>
                <td>
                  <input
                    type="text"
                    value={row.ROnumber}
                    onChange={(e) => handleRowChange(index, 'ROnumber', e.target.value)}
                  />

                </td>
                <td><input type="text" value={row.DOCNumber} onChange={(e) => handleRowChange(index, 'DOCNumber', e.target.value)}  /></td>
                
              
                <td>{row.Address}</td>

                <td>{row.Model}</td>

                <td>{row.Vinchassisno}</td>

                <td>{row.Dateofpurchase}</td>

                <td>{row.Remarksnote}</td>
                <td>{row.Serviceentry}</td>
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
}

export default Pending