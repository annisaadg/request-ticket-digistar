import ProductProject from "../models/ProductProjectModel.js";
import User from "../models/UserModel.js";
import fs from 'fs';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/jpg'];

export const getProductProjects = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isManager = user.role === 'manager';

        // If the user is a manager, filter the product projects
        const whereClause = isManager ? { pic: userId } : {};

        const productProjects = await ProductProject.findAll({
            attributes: ['uuid', 'name', 'description', 'issue_type', 'pic', 'profile_picture', 'profile_picture_mimetype', 'createdAt'],
            where: whereClause
        });

        // Convert profile_picture to base64 format
        const response = productProjects.map((project) => {
            let profile_picture_base64 = null;
            if (project.profile_picture) {
                profile_picture_base64 = `data:${project.profile_picture_mimetype};base64,${project.profile_picture.toString('base64')}`;
            }

            return {
                uuid: project.uuid,
                name: project.name,
                description: project.description,
                issue_type: project.issue_type,
                pic: project.pic,
                profile_picture: profile_picture_base64, // Add profile picture in base64 format
                createdAt: project.createdAt
            };
        });

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const getProductProjectById = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isManager = user.role === 'manager';

        // Find the product project
        const productProject = await ProductProject.findOne({
            attributes: ['uuid', 'name', 'description', 'issue_type', 'pic', 'profile_picture', 'profile_picture_mimetype', 'createdAt'],
            where: { uuid: req.params.id }
        });

        if (!productProject) {
            return res.status(404).json({ msg: "Product/Project not found" });
        }

        // Check if the user is a manager and if they are the pic for the project
        if (isManager && productProject.pic !== userId) {
            return res.status(403).json({ msg: "You are not authorized to access this product/project" });
        }

        // Convert profile_picture to base64 format
        let profile_picture_base64 = null;
        if (productProject.profile_picture) {
            profile_picture_base64 = `data:${productProject.profile_picture_mimetype};base64,${productProject.profile_picture.toString('base64')}`;
        }

        const response = {
            uuid: productProject.uuid,
            name: productProject.name,
            description: productProject.description,
            issue_type: productProject.issue_type,
            pic: productProject.pic,
            profile_picture: profile_picture_base64, // Add profile picture in base64 format
            createdAt: productProject.createdAt
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// Fungsi untuk memeriksa apakah user dengan ID memiliki role manager
const isUserManager = async (userId) => {
    const user = await User.findOne({
        where: { id: userId }
    });
    return user && user.role === 'manager';
};

export const createProductProject = async (req, res) => {
    const { name, description, issue_type, pic } = req.body;

    // Validasi input
    if (!name) return res.status(400).json({ msg: "Name is required" });
    if (!description) return res.status(400).json({ msg: "Description is required" });
    if (!issue_type) return res.status(400).json({ msg: "Issue type is required" });
    if (!pic) return res.status(400).json({ msg: "PIC is required" });

    // Validasi issue_type hanya bisa 'product' atau 'project'
    const validIssueTypes = ["product", "project"];
    if (!issue_type || !validIssueTypes.includes(issue_type.toLowerCase())) {
        return res.status(400).json({ msg: "Issue type must be either 'product' or 'project'" });
    }

    // Validasi bahwa pic adalah user dengan role manager
    const isManager = await isUserManager(pic);
    if (!isManager) return res.status(400).json({ msg: "PIC must be a user with role 'manager'" });

    // Handle profile picture if it exists
    let profile_picture = null;
    let profile_picture_filename = null;
    let profile_picture_mimetype = null;

    if (req.file) {
        // Validate file size
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({ msg: "File size exceeds 2MB limit" });
        }

        // Validate file type
        if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
            return res.status(400).json({ msg: "Invalid file type. Only JPG, PNG, and JPEG are allowed." });
        }

        profile_picture = fs.readFileSync(req.file.path);  // Read the file from disk
        profile_picture_filename = req.file.originalname;            // Store the original filename
        profile_picture_mimetype = req.file.mimetype;                // Store the file's MIME type

        // Optional: delete file after reading to prevent storage issues
        fs.unlinkSync(req.file.path);
    }

    try {
        await ProductProject.create({
            name: name,
            description: description,
            issue_type: issue_type,
            pic: pic,
            profile_picture,
            profile_picture_filename,
            profile_picture_mimetype
        });
        res.status(201).json({ msg: "A new Product/Project registered successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const patchProductProject = async (req, res) => {
    try {
        // Temukan Product/Project berdasarkan uuid
        const productProject = await ProductProject.findOne({
            where: {
                uuid: req.params.id
            }
        });

        if (!productProject) return res.status(404).json({ msg: "Product/Project not found" });

        const { name, description, issue_type, pic } = req.body;
        const updateData = {};

        // Validasi input dan update data
        if (name) updateData.name = name;
        if (description) updateData.description = description;

        // Validasi issue_type hanya bisa 'product' atau 'project'
        const validIssueTypes = ["product", "project"];
        if (issue_type) {
            if (!validIssueTypes.includes(issue_type.toLowerCase())) {
                return res.status(400).json({ msg: "Issue type must be either 'product' or 'project'" });
            }
            updateData.issue_type = issue_type.toLowerCase(); // Store as lowercase
        }

        if (pic) {
            // Validasi bahwa pic adalah user dengan role 'manager'
            const isManager = await isUserManager(pic);
            if (!isManager) return res.status(400).json({ msg: "PIC must be a user with role 'manager'" });
            updateData.pic = pic;
        }

        // Handle profile picture update if file is provided
        if (req.file) {
            // Validate file size
            if (req.file.size > MAX_FILE_SIZE) {
                return res.status(400).json({ msg: "File size exceeds 2MB limit" });
            }

            // Validate file type
            if (!ALLOWED_MIMETYPES.includes(req.file.mimetype)) {
                return res.status(400).json({ msg: "Invalid file type. Only JPG, PNG, and JPEG are allowed." });
            }

            // Read the file and store in updateData
            updateData.profile_picture = fs.readFileSync(req.file.path);  // Read the file from disk
            updateData.profile_picture_filename = req.file.originalname;   // Store the original filename
            updateData.profile_picture_mimetype = req.file.mimetype;       // Store the file's MIME type

            // Optional: delete the file after reading
            fs.unlinkSync(req.file.path);
        }

        // Update the Product/Project with the new data
        await ProductProject.update(updateData, {
            where: {
                uuid: req.params.id
            }
        });

        res.status(200).json({ msg: "Product/Project updated successfully" });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

export const deleteProductProject = async(req, res) =>{
    const productproject = await ProductProject.findOne({
        where: {
            uuid: req.params.id
        }
    });
    if(!productproject) return res.status(404).json({msg: "Product/Project Not Found"});
    try {
        await ProductProject.destroy({
            where:{
                id: productproject.id
            }
        });
        res.status(200).json({msg: "Product/Project Deleted Successfully"});
    } catch (error) {
        res.status(400).json({msg: error.message});
    }
};

export const countProductProjects = async (req, res) => {
    try {
        const userId = req.userId; // req.userId is set by authentication middleware
        const user = await User.findOne({ where: { id: userId } });

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        const isManager = user.role === 'manager';

        // If the user is a manager, filter the product projects
        const whereClause = isManager ? { pic: userId } : {};

        // Get total count of ProductProjects based on conditions
        const totalProductProjects = await ProductProject.count({
            where: whereClause
        });

        res.status(200).json({ totalProductProjects });
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};