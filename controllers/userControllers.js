const User = require("../models/User");
const Note = require("../models/Note");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password").lean();
    if (!users?.length)
        return res.status(404).json({ message: "No Users Found" });
    res.status(200).json(users);
});

// @desc Create New User
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please Provide All Fields" });
    }
    // Check Duplicate
    /*
    Why use lean()
    Purpose: Converts the Mongoose document returned by the query into a plain JavaScript object.
    Reason: This is often used to improve performance, especially when you don't need to access Mongoose's features on the result. Plain JavaScript objects are generally faster to manipulate and consume than Mongoose documents.
    */
    /*
    Why use exec()
    Purpose: Executes the query and returns a Promise that resolves to the result.
    Reason: Mongoose queries are asynchronous, so exec() is used to actually run the query and obtain the result.
   */
    const duplicate = await User.findOne({ username })
        .collation({ locale: "en", strength: 2 })
        .lean()
        .exec();
    if (duplicate) {
        return res.status(409).send({ message: `${username} Already Exist.` });
    }
    // Hash Password
    const hashPwd = await bcrypt.hash(password, 10);

    const userObject =
        !Array.isArray(roles) || !roles.length
            ? { username, password: hashedPwd }
            : { username, password: hashedPwd, roles };
            
    // Save New User
    const user = await User.create(userObject);
    if (!user)
        return res.status(400).json({ message: "Failed To Create New User" });

    res.status(201).json({ message: "User Created SuccessFully." });
});

// @desc Update a User
// @route PATCH /users
// @access Private
const editUser = asyncHandler(async (req, res) => {
    const { id, username, password, roles, active } = req.body;

    if (
        !username ||
        !id ||
        !roles.length ||
        !Array.isArray(roles) ||
        typeof active !== "boolean"
    ) {
        return res.status(400).json({ message: "Please Provide All Fields" });
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: "User Not Found" });
    }

    // Check For Duplicate
    const duplicate = await User.findOne({ username })
        .collation({ locale: "en", strength: 2 })
        .lean()
        .exec();
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: `${username} Already Exist.` });
    }

    user.username = username;
    user.active = active;
    user.roles = roles;

    if (password) {
        user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.json({ message: `${updatedUser.username} Updated` });
});

// @desc Delete User
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: "User ID is Required" });
    }

    const notes = await Note.find({ user: id }).lean().exec();
    if (notes?.length) {
        return res.status(400).json({ message: "User Has Assigned Notes" });
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: "User Not Found" });
    }

    const result = await user.deleteOne();

    const reply = `${user.username} With ID: ${id} Deleted`;
    res.json(reply);
});

module.exports = { getAllUsers, createNewUser, editUser, deleteUser };
