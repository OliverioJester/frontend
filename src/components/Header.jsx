import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <div>
        <Link to='/'>Monitoring</Link>
        <Link to='/dispatching'>Dispatching</Link>
        <Link to='/pending'>Pending</Link>
    </div>
  )
}

export default Header