import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import config from '../api/config';

import { Link } from 'react-router-dom';


const Dispatching = React.memo(() => {
// mechanic Iterinary ang next
  const [error, setError] = useState(null);

  const [rows, setRows] = useState([]); // State for dynamic rows

  const [mechanic, setMechanic] = useState('');
  const [mechanics, setMechanics] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [itinerary, setItinerary] = useState([]);
  const [dispatchDate, setDispatchDate] = useState('');
  const [platenumber, setPlatenumber] = useState('');
  const [time, setTime] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef(new AbortController());

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
// api end

// Mechanictlist
  const handleInputChange = async (e) => {
    const value = e.target.value.toUpperCase();
    setMechanic(value);

    if (value.length > 0) {

      // Abort any ongoing request
        // Abort any ongoing request
        abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        try {
          const response = await axios.get(`${apiUrl}/mechaniclist/${value}`, {
            signal: abortControllerRef.current.signal
          });
          if (mountedRef.current) {
            setSuggestions(response.data); // Ensure response.data is an array of objects
          }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled');
        } else {
          console.error("Error fetching mechanic names:", error);
        }
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleAddMechanic = useCallback(() => {
    if (mechanic.trim() !== '') {
      setMechanics(prevMechanics => {
        const updatedMechanics = [...prevMechanics, mechanic];
        localStorage.setItem('mechanics', JSON.stringify(updatedMechanics));
        return updatedMechanics;
      });
      setMechanic('');
    }
  }, [mechanic]);

  const handleRemoveMechanic = useCallback((index) => {
    setMechanics(prevMechanics => {
      const newMechanics = prevMechanics.filter((_, i) => i !== index);
      localStorage.setItem('mechanics', JSON.stringify(newMechanics));
      return newMechanics;
    });
  }, []);

  const handleSuggestionClick = useCallback((suggestion) => {
    setMechanics(prevMechanics => {
      if (!prevMechanics.includes(suggestion)) {
        const updatedMechanics = [...prevMechanics, suggestion];
        localStorage.setItem('mechanics', JSON.stringify(updatedMechanics));
        return updatedMechanics;
      }
      return prevMechanics;
    });
    setMechanic(''); // Clear the input field
    setSuggestions([]); // Clear suggestions
  }, []);
// Mechanictlist end

// Productcso
  const handleSearch = useCallback(async (index) => {
    const controller = new AbortController();
    try {
      const response = await axios.get(`${apiUrl}/customer/${rows[index].ROnumber}`, {
        signal: controller.signal
      });
      const data = response.data;
      // Format the Dateofpurchase field
      if (data.Dateofpurchase) {
        data.Dateofpurchase = formatDate(data.Dateofpurchase);
      }

      setRows(prevRows => {
        const updatedRows = prevRows.map((row, i) => (i === index ? { ...row, ...data } : row));
        localStorage.setItem('rowsss', JSON.stringify(updatedRows));
        return updatedRows;
      });
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('Request canceled');
      } else {
        setError('Record not found');
        setRows(prevRows => {
          const updatedRows = prevRows.map((row, i) => (i === index ? { ...row, companyData: null } : row));
          localStorage.setItem('rowsss', JSON.stringify(updatedRows));
          return updatedRows;
        });
      }
    }
  }, [apiUrl, rows]);
// Productcso end

// to save 
useEffect(() => {
  mountedRef.current = true;
  const savedRows = localStorage.getItem('rowsss');
  const savedMechanics = localStorage.getItem('mechanics');
  const savedDispatchDate = localStorage.getItem('dispatchDate');
  const savedPlateNumber = localStorage.getItem('platenumber');
  const savedTime = localStorage.getItem('time');
  if (savedRows) {
    setRows(JSON.parse(savedRows));
  }
  if (savedMechanics) {
    setMechanics(JSON.parse(savedMechanics));
  }
  if (savedDispatchDate) {
    setDispatchDate(savedDispatchDate);
  }
  if (savedPlateNumber) {
    setPlatenumber(savedPlateNumber);
  }
  if (savedTime) {
    setTime(savedTime);
  }
  return () => {
    mountedRef.current = false;
    abortControllerRef.current.abort(); // Abort ongoing requests on unmount
  };
}, []);
// to save 

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
      { header: 'DATE OF INSPECTION', key: 'Dateofinspection', width: 50 },
      { header: 'DOC Number', key: 'DOCNumber', width: 30 },
      { header: 'RO Number', key: 'ROnumber', width: 30 },

      { header: 'CSD NO.', key: 'Csdnumber', width: 30 },
      { header: 'Customer Name', key: 'Companyname', width: 40 },
      { header: 'Location', key: 'Address', width: 50 },
      { header: 'CONTACT PERSON/CONTACT NO.', key: 'Telephone', width: 30 },
      { header: 'ISSUE CONCERN', key: 'Remarksnote', width: 50 },
      { header: 'PARTS', key: 'Parts', width: 40 },
      { header: 'STATUS', key: 'Status', width: 30 },
      { header: 'REMARKS', key: 'Remarks', width: 50 },
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

  const handleAddRow = useCallback(() => {
    setRows(prevRows => {
      const newRow = {
      Dateofinspection: '',
      ROnumber: '',
      DOCNumber: '',
      Companyname: '',
      Csdnumber: '',
      Telephone: '',
      Address: '',
      Remarksnote: '',
      Parts: '',
      Status: '',
      Remarks: ''
    };
    const updatedRows = [...prevRows, newRow];
    localStorage.setItem('rowsss', JSON.stringify(updatedRows));
    return updatedRows;
  });
}, []);

  const handleDeleteRow = useCallback((index) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter((_, i) => i !== index);
      localStorage.setItem('rowsss', JSON.stringify(updatedRows));
      return updatedRows;
    });
  }, []);

  const handleRowChange = useCallback((index, key, value) => {
    setRows(prevRows => {
      const updatedRows = [...prevRows];
      updatedRows[index] = { ...updatedRows[index], [key]: value };
      localStorage.setItem('rowsss', JSON.stringify(updatedRows));
      return updatedRows;
    });
  }, []);

// save

const saveButton = useCallback(async () => {

  if (rows.length === 0 || !dispatchDate || !platenumber || !time) {
    alert('Please fill out all required fields before saving.');
    return; // Exit the function early
  }

  try {
    const data = {
      rows: rows.map(row => ({
        Dateofinspection: row.Dateofinspection,
        DOCNumber: row.DOCNumber,
        ROnumber: row.ROnumber,
        Csdnumber: row.Csdnumber,
        Companyname: row.Companyname,
        Address: row.Address,
        Telephone: row.Telephone,
        Remarksnote: row.Remarksnote,
        MechanicNames: mechanics.join('/'),
        Parts: row.Parts,
        Status: row.Status,
        Remarks: row.Remarks,
        DispatchDate: dispatchDate,
        Platenumber: platenumber,
        Dispatchtime: time        
      })),
    };

    

    await axios.post(`${apiUrl}/dispatching`, data);


    // Optimistically update the itinerary
    setItinerary(prevItinerary => [
      ...prevItinerary,
      ...data.rows.map(row => ({
        AssignedMechanics: row.MechanicNames,
        DateInspection: row.Dateofinspection
      })),
    ]);

    alert('Data saved successfully!');
    setRefreshKey(whenclicked => whenclicked + 1);

  } catch (err) {
    console.error('Error saving data:', err);
    alert('Failed to save data. Please try again.');
    
  }
}, [apiUrl, rows, mechanics, dispatchDate, platenumber, time]);



  //Itinerary
    useEffect(() => {
      const fetchItinerary = async () => {
        try {
          const response = await axios.get(`${apiUrl}/dispatchingmechanicnames`);
          setItinerary(response.data);
        } catch (error) {
          console.error('Error fetching mechanics list:', error);
        }
      };
      fetchItinerary();
    }, [apiUrl, refreshKey]);
  //Itinerary end

//save the date,platenumber, and time
const handleDispatchDateChange = (e) => {
  const value = e.target.value;
  setDispatchDate(value);
  localStorage.setItem('dispatchDate', value);
};

const handlePlateNumberChange = (e) => {
  const value = e.target.value;
  setPlatenumber(value);
  localStorage.setItem('platenumber', value);
};

const handleTimeChange = (e) => {
  const value = e.target.value;
  setTime(value);
  localStorage.setItem('time', value);
};

  
  return (
    <div>
        <h1>Search Company by ROnumber Prototype1</h1>
        <h2>Dispatching</h2>
        {error && <p>{error}</p>}
        <div className='form-row'>

        {/*  Itinerary */}
        <div className="container">
          <div className="header">Itinerary</div>
              <div className="scrollable">
                {itinerary.map((allmechanics, index) => (
                <div key={index} className="list-item"> 
                    <Link to={`/dispatching/${allmechanics.Recnumber || ''}`}>
                    <span>{index+1}. </span>
                     <span >{allmechanics.AssignedMechanics}<br/>({allmechanics.DateInspection})</span>  
                    </Link>
                </div>
              ))}
            </div>
        </div>
        {/*  Itinerary End*/}


          {/*  Mechanic inputs */}
          <div className='mechaniclist'>
            <label>Mechanic:</label>
            <input 
              type="text" 
              value={mechanic} 
              onChange={handleInputChange} 
              className='mechanicinput'
            />
            <button onClick={handleAddMechanic}>+</button>

            {/* Dropdown for suggestions */}
            {suggestions.length > 0 && (
            <div className='dropdown-content'>
              {suggestions
                .filter(item => item.MechanicName && item.MechanicName.startsWith(mechanic) && item.MechanicName !== mechanic)
                .map((item, index) => (
                  <div key={index} onClick={() => handleSuggestionClick(item.MechanicName)}>
                    {item.MechanicName} 
                  </div>
                ))
              }
            </div>
            )}

            <div className='scrollable-container'>
            <ul>
              {mechanics.map((mech, index) => (
                <li key={index}>
                    <span className='mechanicname'>{mech}</span>
                  <button onClick={() => handleRemoveMechanic(index)} className='deletemechanic'>x</button>
                </li>
              ))}
            </ul>
            </div>
          </div>

{/* dategroup */}
          <div className='dategroup'>
            <div>
              <Link to='/viewitinerary'>
              <button>View All Itinerary</button>
              </Link>
            </div>
            <div>
  Dispatch Date: 
  <input 
    type="date" 
    value={dispatchDate} 
    onChange={handleDispatchDateChange}  
    className='dispatchdate'
  />
</div>  
<div>
  Plate No: 
  <input 
    type="text" 
    value={platenumber} 
    onChange={handlePlateNumberChange}
    className='platenumber'
  />
</div>  
<div>
  Time: 
  <input 
    type="time" 
    value={time} 
    onChange={handleTimeChange}
    className='time'
  />
</div>
          </div>
        </div>        
{/* dategroup end */}
       
        
        <div>
          
         


          <br />

          <table >
            <thead>
              <tr>
                <th>#</th>
                <th>Date of Inspection</th>{/* editable */}
                <th>DOC NO.</th>{/* editable */}
                <th>R.O No.</th>{/* search bar */}
                <th>CSD No.</th>{/* editable */}
                <th>CUSTOMER NAME</th>
                <th>LOCATION</th>{/* editable */}
                <th>CONTACT PERSON/CONTACT NO.</th>{/* editable */}
                <th>ISSUE CONCERN</th>{/* editable */}
                <th>PARTS</th>
                <th>STATUS</th>{/* editable */}
                <th>REMARKS</th>{/* editable */}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}  className='table'>
                  <td>{index + 1}{row.index}</td>
                  <td><input type="date" value={row.Dateofinspection} onChange={(e) => handleRowChange(index, 'Dateofinspection', e.target.value)} /></td>
                  <td><input type="text" value={row.DOCNumber} onChange={(e) => handleRowChange(index, 'DOCNumber', e.target.value)}  /></td>
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
                  <td><input type="text" value={row.Csdnumber} onChange={(e) => handleRowChange(index, 'Csdnumber', e.target.value)} /></td>
                  <td>{row.Companyname}</td>
                  <td><input type="text" value={row.Address} onChange={(e) => handleRowChange(index, 'Address', e.target.value)} /></td>
                  <td><input type="text" value={row.Telephone} onChange={(e) => handleRowChange(index, 'Telephone', e.target.value)} /></td>
                  <td><textarea value={row.Remarksnote} onChange={(e) => handleRowChange(index, 'Remarksnote', e.target.value)}/></td>
                  <td><input type="text" value={row.PartsNeed} onChange={(e) => handleRowChange(index, 'Parts', e.target.value)} /></td>
                  <td><input type="text" value={row.StatusJOB} onChange={(e) => handleRowChange(index, 'Status', e.target.value)} /></td>
                  <td><input type="text" value={row.RemarksNote} onChange={(e) => handleRowChange(index, 'Remarks', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className='add-row'>
            <button className='' onClick={handleAddRow}>Add Row</button>
          </div>

          <div className='save'>
            <button className='' onClick={saveButton}>Save</button>
          </div>
          
          <button className='export' onClick={handleExport} disabled={!rows.length}>Export to Excel</button>
        </div>      
    </div>
  )
});
// to be continued... need gumawa ng editbutton
export default Dispatching