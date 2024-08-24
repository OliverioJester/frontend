import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import config from '../api/config';
import axios from 'axios';

const IteneraryEdit = () => {
  const {id} = useParams();
  const [dateInspection, setDateInspection] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [roNumber, setRoNumber] = useState('');
  const [csdNumber, setCsdNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [remarksnote, setRemarksnote] = useState('');
  const [parts, setParts] = useState('');
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [mechanicname, setMechanicname] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [dispatchDate, setDispatchDate] = useState('');
  const [platenumber, setPlatenumber] = useState('');
  const [dispatchtime, setDispatchtime] = useState('');
  const [itinerary, setItinerary] = useState([]);
  
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
                                                                                                                                      
useEffect(() => {
  axios.get(`${apiUrl}/dispatching/${id}`)
  .then(res =>{
    const data = res.data;
      setDateInspection(data.DateInspection || '');
      setDocNumber(data.DocNumber || '');
      setRoNumber(data.RoNumber || '');
      setCsdNumber(data.CsdNo || '');
      setCustomerName(data.CustomerName || '');
      setLocation(data.LocationAddress || '');
      setContactNumber(data.ContactPerson || '');
      setRemarksnote(data.IssueAndConcern || '');
      setParts(data.PartsNeed || '');
      setStatus(data.StatusJOB || '')
      setRemarks(data.RemarksNote || '');
      setMechanicname(data.AssignedMechanics ? data.AssignedMechanics.split('/') : []);
      setDispatchDate(data.DispatchDate || '');
      setPlatenumber(data.Platenumber || '');
      setDispatchtime(data.Dispatchtime || '');
  })
  .catch(err => console.log(err));
}, [id, apiUrl])


//Add mechanicnames
const handleAddMechanic = () => {
  if (mechanic && !mechanicname.includes(mechanic)) {
    setMechanicname([...mechanicname, mechanic]);
    setMechanic('');
  }
};

const handleSuggestionClick = (name) => {
  setMechanic(name);
  setSuggestions([]);
};


const handleRemoveMechanic = (index) => {
  const updatedMechanics = mechanicname.filter((_, i) => i !== index);
  setMechanicname(updatedMechanics);
};

const mountedRef = useRef(true);
const abortControllerRef = useRef(new AbortController());

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
//Add mechanicnames end


// Update Button
const navigate = useNavigate();

const handleSubmit = (e) => {
  e.preventDefault();
  const updatedData = {
    DateInspection: dateInspection,
    DocNumber: docNumber,
    RoNumber: roNumber,
    CsdNo: csdNumber,
    CustomerName: customerName,
    AssignedMechanics: mechanicname.join('/'),
    LocationAddress: location,
    ContactPerson: contactNumber,
    IssueAndConcern: remarksnote,
    PartsNeed: parts,
    StatusJOB: status,
    RemarksNote: remarks,
    DispatchDate: dispatchDate,
    Platenumber: platenumber,
    Dispatchtime: dispatchtime
  };
  
  axios.put(`${apiUrl}/dispatching/${id}`, updatedData)
    .then(res => {
      if (res.status === 200) {
        alert("Update successful");
        navigate(`/dispatching/${id}`);
      } else {
        alert("Error: Update failed");
      }
    })
    .catch(err => {
      console.error("Error during update:", err);
      alert("An error occurred while updating. Please try again.");
    });
}

// Update Button End

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const response = await axios.get(`${apiUrl}/dispatchingmechanicnames`);
        setItinerary(response.data);
      } catch (error) {
        console.error('Error fetching itinerary data:', error);
      }
    };
    fetchItinerary();
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Edit Itinerary</h1>
        <h2>Dispatching</h2>
        {/* {error && <p>{error}</p>} */}
        <div className='form-row'>
          {/* Itinerary Section */}
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

          {/* Mechanic Inputs */}

          <div className='mechaniclist'>
            <label>Mechanic:</label>
            <input
              type="text"
              value={mechanic}
              onChange={handleInputChange}
              className='mechanicinput'
            />
            <button onClick={handleAddMechanic}>+</button>

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
              {mechanicname.map((mech, index) => (
                  <li key={index}>
                    <span className='mechanicname'>{mech}</span>
                    <button onClick={() => handleRemoveMechanic(index)} className='deletemechanic'>x</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Date Group */}
          <div className='dategroup'>
            <div>
              <Link to='/viewitinerary'>
                <button>View All Itinerary</button>
              </Link>
            </div>
            <div>
              Dispatch Date: <input type="date" value={dispatchDate} className='dispatchdate' />
            </div>
            <div>
              Plate No: <input type="text" value={platenumber} className='platenumber' />
            </div>
            <div>
              Time: <input type="time" value={dispatchtime} className='time' />
            </div>
          </div>

          {/* Table */}
          <div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date of Inspection</th>
                  <th>DOC NO.</th>
                  <th>R.O No.</th>
                  <th>CSD No.</th>
                  <th>CUSTOMER NAME</th>
                  <th>LOCATION</th>
                  <th>CONTACT PERSON/CONTACT NO.</th>
                  <th>ISSUE CONCERN</th>
                  <th>PARTS</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
          
                  <tr className='table'>
                    <td></td>
                    <td><input type="date"  value={dateInspection} onChange={e => setDateInspection(e.target.value)}/></td>
                    <td><input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)}/></td>
                    <td><input type="text" value={roNumber} onChange={e => setRoNumber(e.target.value)}/></td>
                    <td><input type="text" value={csdNumber} onChange={e => setCsdNumber(e.target.value)}/></td>
                    <td><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}/></td>
                    <td><input type="text"  value={location} onChange={e => setLocation(e.target.value)}/></td>
                    <td><input type="text"  value={contactNumber} onChange={e => setContactNumber(e.target.value)}/></td>
                    <td><textarea  value={remarksnote} onChange={e => setRemarksnote(e.target.value)}/></td>
                    <td><input type="text"  value={parts} onChange={e => setParts(e.target.value)}/></td>
                    <td><input type="text"  value={status} onChange={e => setStatus(e.target.value)}/></td>
                    <td><input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}/></td>
                  </tr>
              
              </tbody>
            </table>


            <div className='save'>
              <button className='' type='submit'>Update</button>
            </div>

            <button className='export' >Export to Excel</button>
          </div>
        
        </div>
      </form>
    </div>
  );
};

export default IteneraryEdit;
