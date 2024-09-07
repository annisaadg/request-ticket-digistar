import User from "../models/UserModel.js";
import argon2 from "argon2";

export const Login = async (req, res) =>{
    const user = await User.findOne({
        where: {
            email: req.body.email
        }
    });
    if(!user) return res.status(404).json({msg: "User Not Found"});
    const match = await argon2.verify(user.password, req.body.password);
    if(!match) return res.status(400).json({msg: "Wrong Password"});
    req.session.userId = user.uuid;
    const uuid = user.uuid;
    const name = user.name;
    const email = user.email;
    const role = user.role;
    const nomor_handphone = user.nomor_handphone;
    res.status(200).json({uuid, name, email, role, nomor_handphone});
}

export const Me = async (req, res) =>{
    if(!req.session.userId){
        return res.status(401).json({msg: "You Have to be Logged In"});
    }
    const user = await User.findOne({
        attributes:['uuid','name','email','role','nomor_handphone','createdAt'],
        where: {
            uuid: req.session.userId
        }
    });
    if(!user) return res.status(404).json({msg: "User Not Found"});
    res.status(200).json(user);
}

export const patchMe = async (req, res) => {
    const userId = req.session.userId; // Mendapatkan ID pengguna yang sedang login dari sesi

    if (!userId) {
        return res.status(401).json({ msg: "You have to be logged in" });
    }

    // Mencari pengguna yang sesuai dengan ID dari sesi
    const user = await User.findOne({
        where: {
            uuid: userId
        }
    });

    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }

    const { name, email, password, confPassword, role, nomor_handphone } = req.body;
    let hashPassword = user.password; // Default password lama

    // Validasi password jika disertakan
    if (password) {
        if (password !== confPassword) {
            return res.status(400).json({ msg: "Password and Confirm Password don't match" });
        }
        hashPassword = await argon2.hash(password);
    }

    // Hanya admin yang bisa mengupdate role
    if (role) {
        if (user.role !== "admin") {
            return res.status(403).json({ msg: "Only admins can update role" });
        }
        const normalizedRole = role.trim().toLowerCase();
        if (!validRoles.includes(normalizedRole)) {
            return res.status(400).json({ msg: "Invalid role" });
        }
    }

    try {
        // Memperbarui data pengguna dengan data yang disediakan
        await User.update({
            name: name !== undefined ? name : user.name,
            email: email !== undefined ? email : user.email,
            password: hashPassword,
            role: role !== undefined ? role.trim().toLowerCase() : user.role,
            nomor_handphone: nomor_handphone !== undefined ? nomor_handphone : user.nomor_handphone
        }, {
            where: {
                uuid: userId
            }
        });

        res.status(200).json({ msg: "User updated successfully" });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: "Email already in use" });
        }
        res.status(500).json({ msg: error.message });
    }
}

export const logOut = (req, res) =>{
    req.session.destroy((err)=>{
        if(err) return res.status(400).json({msg: "Can Not Log Out"});
        res.status(200).json({msg: "Logged Out Successfully"});
    });
}