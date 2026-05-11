import { insertUserProfile, getUserById, updateUserProfile, getAllUserProfiles, deleteUserProfile, getUserByHRMSNo, getUsersByBranchName, getUsersByBranchRegionName } from "../../model/user/userProfile.model.js";


export const createUserProfile = async (req, res) => {
    try {
        const userProfile = req.body;
        const result = await insertUserProfile(userProfile);
        res.status(201).json({ message: "User profile created successfully", result });
    } catch (error) {
        console.error("Error creating user profile:", error);
        res.status(500).json({ message: "Error creating user profile", error });
    }
};

// .get user profile by user ID
export const getUserProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await getUserById(id);

        if (result.length === 0) {
            return res.status(404).json({ message: "User profile not found" });
        }

        res.status(200).json({ message: "User profile retrieved successfully", result: result[0] });

    } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: "Error retrieving user profile", error });
    }
};

// update user profile

export const updateUserProfileController = async (req, res) => {
    try {
        const userId = req.params.id;
        const profileData = req.body;

        // Validate required fields
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const result = await updateUserProfile(userId, profileData);

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: result
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update user profile'
        });
    }
};


// get all user profiles
export const getAllUserProfilesController = async (req, res) => {
    try {
        const result = await getAllUserProfiles();
        res.status(200).json({ message: "User profiles retrieved successfully", result });
    } catch (error) {
        console.error("Error retrieving user profiles:", error);
        res.status(500).json({ message: "Error retrieving user profiles", error });
    }
}

// delete user profile
export const deleteUserProfileController = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await deleteUserProfile(id);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "User profile not found" });
        }

        res.status(200).json({ message: "User profile deleted successfully", result });
    } catch (error) {
        console.error("Error deleting user profile:", error);
        res.status(500).json({ message: "Error deleting user profile", error });
    }
}

// get user profile by HRMS No
export const getUserByHRMSNoController = async (req, res) => {
    try {
        const { hrmsNo } = req.params;
        const result = await getUserByHRMSNo(hrmsNo);

        if (result.length === 0) {
            return res.status(404).json({ message: "User profile not found" });
        }
        res.status(200).json({ message: "User profile retrieved successfully", result: result[0] });
    } catch (error) {
        console.error("Error retrieving user profile:", error);
        res.status(500).json({ message: "Error retrieving user profile", error });
    }
}

// get user profiles by branch name
export const getUsersByBranchNameController = async (req, res) => {
    try {
        const { branchName } = req.params;
        const result = await getUsersByBranchName(branchName);

        if (result.length === 0) {
            return res.status(404).json({ message: "No user profiles found for this branch" });
        }
        res.status(200).json({ message: "User profiles retrieved successfully", result });
    } catch (error) {
        console.error("Error retrieving user profiles:", error);
        res.status(500).json({ message: "Error retrieving user profiles", error });
    }   
}

// get user profiles by branch region name
export const getUsersByBranchRegionNameController = async (req, res) => {
    try {
        const { branchRegionName } = req.params;
        const result = await getUsersByBranchRegionName(branchRegionName);

        if (result.length === 0) {
            return res.status(404).json({ message: "No user profiles found for this branch region" });
        }
        res.status(200).json({ message: "User profiles retrieved successfully", result });
    } catch (error) {
        console.error("Error retrieving user profiles:", error);
        res.status(500).json({ message: "Error retrieving user profiles", error });
    }   
}