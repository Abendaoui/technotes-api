const express = require("express");
const {
   getAllUsers,
   createNewUser,
   editUser,
   deleteUser,
} = require("../controllers/userControllers");
const verifyJWT = require("../middlewares/verifyJWT");
const router = express.Router();


router.use(verifyJWT)

router
   .route("/")
   .get(getAllUsers)
   .post(createNewUser)
   .patch(editUser)
   .delete(deleteUser);

module.exports = router;
