import { Navigate, Route,Routes } from "react-router-dom"
import HomePage from './pages/home'
import LoginPage from './pages/loginPage'
import ProfilePage from './pages/profilePage'
import {Toaster} from 'react-hot-toast'
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

const app=()=>{
  const {authUser}= useContext(AuthContext)
  return(
<div className="bg-black">
  <Toaster/>
  <Routes >
    <Route path ='/'element={authUser?<HomePage/>:<Navigate to= '/login'/>}/>
    <Route path ='/login'element={!authUser?<LoginPage/> : <Navigate to='/'/>}/>
    <Route path ='/profile'element={authUser?<ProfilePage/>: <Navigate to ='/login'/>}/>
  </Routes>
</div>
  )
}
export default app