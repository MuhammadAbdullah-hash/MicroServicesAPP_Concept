const router = require("express").Router();
const { userInterfaceController } = require("../controllers");

router.get("/" , userInterfaceController.renderHomePage)


module.exports = router;