import { useContext, useState, useEffect } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

const ProfileModal = ({ show, onClose }) => {
    const {authUser, updateProfile} = useContext(AuthContext)
    const [selectedImg, setselectedImg] = useState(null);
    const [name, setname] = useState('');
    const [bio, setbio] = useState('');

    useEffect(() => {
        if (authUser) {
            setname(authUser.fullName || '');
            setbio(authUser.bio || '');
        }
    }, [authUser]);

    const handleSubmit= async(e)=>{
        e.preventDefault()
        try {
            if(!selectedImg){
                await updateProfile({fullName: name, bio});
                onClose();
                return;
            }

            const reader = new FileReader();
            reader.onload = async () => {
                const base64Image = reader.result;
                await updateProfile({profilePic: base64Image, fullName: name, bio});
                onClose();
            };
            reader.readAsDataURL(selectedImg);
        } catch (error) {
            console.error('Profile update error:', error);
        }
    }

    if (!show) return null;

    return(
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black ">
  <div className="bg-black w-5/6 max-w-2xl text-gray-300 md:border-1 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg relative">
    <button onClick={onClose} className="absolute top-2 right-2 text-white text-2xl">&times;</button>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">
     <h3 className="text-lg">Profile Details</h3>
     <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer">
     <input onChange={(e)=>setselectedImg(e.target.files[0])} type="file" id="avatar" accept=".png, .jpg, .jpeg" hidden/>
     <img src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.avatar_icon)} alt=""
       className={`w-12 h-12 ${selectedImg && 'rounded-full'}`} /> upload profile image
       </label>
       <input onChange={(e)=>setname(e.target.value)} type="text" required placeholder="User Name" value={name} 
        className="p-2 border border-gray-500 rounded-md focus:outline focus:ring-2 focus:ring-violet-500"/>
        <textarea onChange={(e)=>setbio(e.target.value)} value={bio} placeholder="About " className="p-2 border border-gray-500 rounded-md focus:outline focus:ring-2 focus:ring-violet-500" rows={4}></textarea>
         <button type="submit" className="bg-gradient-to-r from-purple-400 to-violet-600 text-white hover:bg-violet-900 p-2 rounded-full text-lg cursor-pointer">Save</button>
    </form>
    <img className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && 'rounded-full'}`} 
         src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser?.profilePic || assets.logo_icon)} alt="" />
   </div>
</div>
    )
}
export default ProfileModal