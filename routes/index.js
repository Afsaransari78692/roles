const express = require("express");
const router = express.Router();
const mongodb = require("mongodb");

router.get("/login", async function (req, res, next) {
  res.render("index");
});

router.get("/", async function (req, res, next) {
  res.redirect("/login");
});

router.get("/dashboard", async function (req, res, next) {
  try {

    if (Object.keys(env_setup).length === 0) {
      res.render("dashboard", { totalUser: 0, totalDatabase: 0 });
    } else {
      const uri = await connectionString(env_setup);
      const client = new mongodb.MongoClient(uri);
      let db = await client.db("admin");
      let User = await db.command({ usersInfo: 1 });
      const listDatabase = await db.command({
        listDatabases: 1,
        nameOnly: true,
      });
      let totalDatabase = listDatabase.databases.length;
      let totalUser = User.users.length;

      res.render("dashboard", {
        totalUser: totalUser,
        totalDatabase: totalDatabase,
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});

router.post("/login", async function (req, res, next) {
  try {
    if (req.body.email == process.env.EMAIL) {
      if (req.body.password == process.env.PASSWORD) {
        res.json({
          statusCode: 200,
          redirect_url: process.env.DASHBOARD_URL,
        });
      } else {
        res.json({
          statusCode: 401,
          message: "Invalid Password",
        });
      }
    } else {
      res.json({
        statusCode: 401,
        message: "Invalid email",
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.get("/list-database", async function (req, res, next) {
  try {
    if (Object.keys(env_setup).length === 0) {
      res.render("listDatabase", { listDatabase: [] });
    } else {
      const uri = await connectionString(env_setup);
      const client = new mongodb.MongoClient(uri);
      let db = await client.db("admin");
      const listDatabase = await db.command({ listDatabases: 1 });

      for (let i = 0; i < listDatabase.databases.length; i++) {
        listDatabase.databases[i].sizeOnDisk = await calculateDbSize(
          listDatabase.databases[i].sizeOnDisk
        );
      }
      res.render("listDatabase", { listDatabase: listDatabase.databases });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.get("/list-user", async function (req, res, next) {
  try {
    if (Object.keys(env_setup).length === 0) {
      res.render("UserList", { OnlyUserName: [] });
    } else {
      const uri = await connectionString(env_setup);
      const client = new mongodb.MongoClient(uri);
      let db = await client.db("admin");
      let User = await db.command({ usersInfo: 1 });

      if (User.users.length < 1) {
        res.status(404).send({
          message: "No data found",
        });
      } else {
        let OnlyUserName = User.users.map((element) => {
          return { userName: element.user, role: element.roles };
        });
        res.render("UserList", { OnlyUserName: OnlyUserName });
      }
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});

router.get("/user-create", async function (req, res, next) {
  try {
    if (Object.keys(env_setup).length === 0) {
      res.render("create", { listDatabase: [] });
    } else {
      const uri = await connectionString(env_setup);
      const client = new mongodb.MongoClient(uri);
      let db = await client.db("admin");
      const listDatabase = await db.command({ listDatabases: 1 });

      res.render("create", { listDatabase: listDatabase.databases });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});

router.post("/user-create", async function (req, res, next) {
  try {
    
    if (req.body.name == "" || !req.body.name) {
      //return res.json(400, "userName is Required");
      res.status(400);
      res.json({
        statusCode: 400,
        data: "userName is Required",
      });
    }
    if (!req.body.role || req.body.role == "") {
      //return res.json(400, "Role is Required");
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Role is Required",
      });
    }
    if (!req.body.database || req.body.database == "") {
      //return res.json(400, "Database is Required");
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Database is Required",
      });
    }
    if (!req.body.password || req.body.password == "") {
      //return res.json(400, "Password is Required");
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Password is Required",
      });
    }
 
    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");

    const auth = await db.command({
      usersInfo: { user: req.body.name, db: "admin" },
      showPrivileges: true,
    });
    if (auth.users.length > 0) {
      //res.status(400)
      //return res.json(400, "UserName Already exist");
      res.status(400);
      res.json({
        statusCode: 400,
        data: "UserName Already exist",
      });
    } else {
      let role = [];

      if (req.body.role == "read" || req.body.role == "readWrite") {
        role = [
          {
            role: req.body.role,
            db: req.body.database,
          },
        ];
      } else if (req.body.role == "all") {
        role = [
          {
            role: "readWriteAnyDatabase",
            db: "admin",
          },
        ];
      } else {
        for (let i = 0; i < req.body.role.length; i++) {
          role.push({
            role: req.body.role[i],
            db: req.body.database[i],
          });
        }
      }

      const createUser = await db.command({
        createUser: req.body.name,
        pwd: req.body.password,
        roles: role,
      });
      if (createUser.ok === 1) {
        let uri = await connectionString(env_setup);
        const myArray = uri.split("@");

        let urlToConnectDatabase = `mongodb://${req.body.name}:${req.body.password}@${myArray[1]}`;
        res.render("success", {
          messages: "User Created Successfully",
          urlToConnectDatabase: urlToConnectDatabase,
        });
      } else {
        res.status(500);
        next(error);
        res.render("server_error");
      }
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});

router.get("/update-user", async function (req, res, next) {
  try {
    if (Object.keys(env_setup).length === 0) {
      res.render("update", { user: [], listDatabase: [] });
    } else {
      const uri = await connectionString(env_setup);
      const client = new mongodb.MongoClient(uri);
      let db = await client.db("admin");
      let User = await db.command({ usersInfo: 1 });
      let OnlyUserName = User.users.map((element) => {
        return { userName: element.user, role: element.roles };
      });
      const listDatabase = await db.command({ listDatabases: 1 });
      res.render("update", {
        user: OnlyUserName,
        listDatabase: listDatabase.databases,
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.post("/update-user", async function (req, res, next) {
  try {
    let role = [];
    let object = {};
    let isValidate = true
    
    if (req.body.name == "" || !req.body.name) {
      
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Name Required",
      });
    }
    if (req.body.name == 'boit') {
     
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Admin user you can't update",
      });
    }
    if (!req.body.role || req.body.role == "") {
      
      res.status(400);
      res.json({
        statusCode: 400,
        data: "role is Required",
      });
    }
    if (!req.body.database || req.body.database == "") {
      
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Database is Required",
      });
    }
    
    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");

    if (req.body.role == "null" && req.body.database == "null") {
     
      let UserUpdate = await db.command({
        updateUser: req.body.name,
        roles: []
      });
      res.render("remove", { messages: "Role Updated Successfully" });
    } else if (req.body.role == "read" || req.body.role == "readWrite") {
      object.role = req.body.role;
      object.db = req.body.database;
      role.push(object);
    } else if (req.body.role == "all") {
      role = [
        {
          role: "readWriteAnyDatabase",
          db: "admin",
        },
      ];
    } else {
      for (let i = 0; i < req.body.role.length; i++) {
        role.push({
          role: req.body.role[i],
          db: req.body.database[i],
        });
      }
    }

    let UserUpdate = await db.command({
      grantRolesToUser: req.body.name,
      roles: role,
    });
    res.render("remove", { messages: "Role Updated Successfully" });
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});

//globalVariable Update
router.post("/set-environment", function (req, res, next) {
  try {
    env_setup = {
      env: req.body.env,
    };
    res.json({
      statusCode: 200,
    });
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.post("/Auth", function (req, res, next) {
  try {
    if (req.body.email == process.env.EMAIL) {
      res.status(200);
      
    } else {
      res.status(400);
      res.json({
        statusCode: 400,
        redirect: "/",
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
//logout
router.get("/logout", function (req, res, next) {
  try {
    env_setup = {};
    res.redirect("/login");
  } catch (error) {
    next(error);
  }
});
router.get("/remove-env", function (req, res, next) {
  try {
    env_setup = {};
    res.json({
      statusCode: 200,
      redirect_url: process.env.DASHBOARD_URL,
    });
  } catch (error) {
    next(error);
  }
});
router.post("/get-user", async function (req, res, next) {
  try {
    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");

    let UserUpdate = await db.command({ usersInfo: req.body.name });
    if (UserUpdate.ok == 1) {
      res.json({
        statusCode: 200,
        data: UserUpdate.users[0].roles,
      });
    } else {
      res.json({
        statusCode: 401,
        data: {},
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.post("/reset-password", async function (req, res, next) {
  try {
    if (req.body.name == "" || req.body.password == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Name or Password is required",
      });
    }
    if (req.body.name == 'boit') {
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Admin user you can't change password",
      });
    }

    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");

    let UserUpdate = await db.command({
      updateUser: req.body.name,
      pwd: req.body.password,
    });

    if (UserUpdate.ok === 1) {
      let uri = await connectionString(env_setup);
      const myArray = uri.split("@");

      let urlToConnectDatabase = `mongodb://${req.body.name}:${req.body.password}@${myArray[1]}`;
      res.json({
        statusCode: 200,
        data: urlToConnectDatabase,
      });
    } else {
      res.status(500);
      next(error);
      res.render("server_error");
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.post("/revoke-role", async function (req, res, next) {
  try {
    if (req.body.name == "" || req.body.db == "" || req.body.role == "") {
      res.status(400);
      res.json({
        statusCode: 400,
        data: "Please filled the Required Field",
      });
    }
    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");

    let UserUpdate = await db.command({
      revokeRolesFromUser: req.body.name,
      roles: [
        {
          role: req.body.role,
          db: req.body.db,
        },
      ],
    });
    res.json({
      statusCode: 200,
      data: "Successfully Revoked ",
    });
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
router.post("/user-validate", async function (req, res, next) {
  try {
    if (req.body.name == "" || !req.body.name) {
      return res.json(400, "userName is Required");
    }

    const uri = await connectionString(env_setup);
    const client = new mongodb.MongoClient(uri);
    let db = await client.db("admin");
   
    const auth = await db.command({
      usersInfo: { user: req.body.name, db: "admin" },
      showPrivileges: true,
    });
    if (auth.users.length > 0) {

      res.status(400);
      res.json({
        statusCode: 400,
        data: "UserName Already exist",
      });
    } else {
      res.status(200);
      res.json({
        statusCode: 200,
        data: "UserName Correct",
      });
    }
  } catch (error) {
    res.status(500);
    next(error);
    res.render("server_error");
  }
});
//connection String return
async function connectionString(object) {
  if (object == null) {
    return {};
  } else {
    if (object.env == "dev") {

      return process.env.MASTER_CONNECTION_STRING_DEV;
    } else if (object.env == "sand") {
      return process.env.MASTER_CONNECTION_STRING_SAND;
    } else if (object.env == "test") {
      return process.env.MASTER_CONNECTION_STRING_TEST;
    } else {
      return {};
    }
  }
}

async function calculateDbSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 MB";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  i < 2 ? (i = 2) : ""; // To set mb as the least returned value
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

module.exports = router;
