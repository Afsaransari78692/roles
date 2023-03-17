let JqueryFunction = {};
let getEnv = localStorage.getItem("env");

let count = 0
let validateName = false
$("#multiple").change(function () {
  //Use $option (with the "$") to see that the variable is a jQuery object
  let $option = $(this).find("option:selected");
  //Added with the EDIT
  let value = $option.val(); //to get content of "value" attrib
  localStorage.setItem("env", value);

  let object = {
    env: value,
  };

  $.ajax({
    url: "/set-environment",
    type: "post",
    dataType: "json",
    contentType: "application/json",
    data: JSON.stringify(object),
    success: function (data) {
      if (data.statusCode == 200) {
        setTimeout(function () {
          location.reload();
        });
        JqueryFunction.Loading(1);
      }
    },
  });
});
$("#multiple").val(getEnv).attr("selected", "selected");

$("#logout").click(function (e) {
  localStorage.clear();
});

$("#newField").click(function () {
  $("#card").clone().appendTo("#halfSection");
  count++

});
$("#removeNewField").click(function () {
  if (count == 0) {
    return
  } else {
    $("#card").remove();
    count--

  }
});

$("a").click(function () {
  JqueryFunction.Loading(1);
});
// $("#createButton").click(function (e) {

//   e.preventDefault();
//   if (validateName == false) {
//     alert("Username is Already Exist")

//   } else {
//     JqueryFunction.Loading(1);
//     let name = $("#name").val();
//     let role = $("#role1").val();
//     let database = $("#database1").val();
//     let password = $("#password").val();

//     $.ajax({
//       type: "post",
//       url: CREATE_USER,
//       data: {
//         name: name,
//         role: role,
//         database: database,
//         password:password
//       },
//       success: function (data) {
//         $("#newUserId").submit();
//         return
//       },
//       error: function (request, status, error) {

//         alert(request.responseJSON.data);
//         JqueryFunction.Loading(0);
//       },
//     });

//   }

// });
$(".table-hover").on("change", "#ddlDates", function () {
  // get the current row
  let modal = $('#modalDialog');
  let span = $(".close");
  let thisProp = $(this);
  function removeRow(thisProp) {
    $(thisProp).closest("tr").remove();
  }
  let actionValue = $(this).val();
  $("#ddlDates option").prop("selected", function () {
    return this.defaultSelected;
  });

  let currentRow = $(this).closest("tr");

  if (actionValue == "resetPassword") {
    let col1 = currentRow.find("td:eq(0)").text(); // get current row 1st TD value
    let name = col1.trim();
    //modal.show();
    modal.show('slow')
    $("#name").val(name);
    $("#modalDialog").css({ 'backdrop-filter': 'blur(1px)' });


  }
  if (actionValue == "revokeRole") {
    let col1 = currentRow.find("td:eq(0)").text();
    let col12 = currentRow.find("td:eq(1)").text(); // get current row 1st TD value

    let db = col1.trim();
    let role = col12.trim();
    let selectedName = $("#name1 option:selected").val();

    if (confirm("Are you sure want Revoke ?")) {
      JqueryFunction.Loading(1);
      $.ajax({
        type: "post",
        url: "/revoke-role",
        data: {
          name: selectedName,
          role: role,
          db: db,
        },
        success: function (data) {
          if (data.statusCode == 200) {
            removeRow(thisProp);
            JqueryFunction.Loading(0);

            alert(data.data);
          }
        },
        error: function (request, status, error) {
          alert(request.responseJSON.data);
          JqueryFunction.Loading(0);
        },
      });
    }
  }
});
//chrome://new-tab-page/
$(window).bind("pageshow", function (event) {
  if (event.originalEvent.persisted) {
    console.log("optimser")
    location.reload();
  }
});
$('#checkbox').click(function () {

  if ($('#password').attr('type') == 'text') {
    $('#password').attr('type', 'password');
  } else {
    $('#password').attr('type', 'text');
  }
});
$("#updateUserRole").click(function (e) {
  e.preventDefault();
  JqueryFunction.Loading(1);
  let name = $("#name1").val();
  let role = $("#role1").val();
  let database = $("#database1").val();
  $.ajax({
    type: "post",
    url: "/update-user",
    data: {
      name: name,
      role: role,
      database: database
    },
    success: function (data) {
      $('#updateUserRoleForm').submit();
    },
    error: function (request, status, error) {

      alert(request.responseJSON.data);
      JqueryFunction.Loading(0);
    },
  });
});
JqueryFunction.loginValidation = async function () {
  $("#submitbutton").click(function (event) {
    event.preventDefault();
    let email = $("#email").val();
    let password = $("#password").val();

    $.ajax({
      type: "post",
      url: "/login",
      data: {
        email: email,
        password: password,
      },
      success: function (data) {
        if (data.statusCode == 200) {
          localStorage.setItem("email", email);
          window.location.href = data.redirect_url;
        } else {
          alert("Invalid Email or Password");
        }
      },
    });
  });
};

JqueryFunction.authentication = async function () {
  let emailverify = localStorage.getItem("email");
  console.log("emailverify", emailverify)
  if (emailverify == null) {
    window.location.href = "/";
  } else {

    $.ajax({
      type: "post",
      url: "/Auth",
      data: {
        email: emailverify,
      },
      success: function (data) {
      },
      error: function (request, status, error) {

        window.location.href = "/";
        localStorage.removeItem("email");
        JqueryFunction.Loading(0);
      },
    });
  }
};
JqueryFunction.Loading = async function (show) {
  if (show) $("body").find("#main-loading").addClass("active");
  else $("body").find("#main-loading").removeClass("active");
};
JqueryFunction.lastPage = async function () {
  let getEmail = localStorage.getItem("email");

  if (getEmail == null) {
  } else {
    JqueryFunction.Loading(1);
    $.ajax({
      type: "get",
      url: "/remove-env",
      success: function (data) {
        if (data.statusCode == 200) {
          console.log("data", data)
          localStorage.removeItem("env");
          window.location.href = data.redirect_url;
        }
      },
    });
  }
};
JqueryFunction.get_user = async function () {
  $("#name1").change(function () {
    let selectedVal = $("#name1 option:selected").val();

    JqueryFunction.Loading(1);
    $.ajax({
      type: "post",
      url: "/get-user",
      data: {
        name: selectedVal,
      },
      success: function (data) {
        if (data.statusCode == 200) {
          if (data) {
            for (let i = 0; i < data.data.length; i++) {
              $("#users tbody").append(
                "<tr><td class=db>" +
                data.data[i].db +
                "</td><td class=role>" +
                data.data[i].role +
                "</td><td>" +
                `<select id="ddlDates">` +
                `<option value="">Action</option>` +
                `<option value="revokeRole">Revoke Role</option>` +
                `</select>` +
                "</td></tr>"
              );
            }

            JqueryFunction.Loading(0);
          }
        } else {
          alert("Data Not found");
        }
      },
    });
  });
};
JqueryFunction.resetPassword = async function () {
  let modal = $('#modalDialog');
  let span = $(".close");
  $('#name').prop('disabled', true);
  $(".modalbutton").click(function (e) {
    e.preventDefault();
    JqueryFunction.Loading(1);
    let password = $("#password").val();
    let name = $("#name").val();

    $.ajax({
      type: "post",
      url: "/reset-password",
      data: {
        name: name,
        password: password,
      },
      success: function (data) {
        if (data.statusCode == 200) {
          modal.hide();
          $("#contactFrm")[0].reset();
          JqueryFunction.Loading(0);
          modal.show();
          $("#connectionString").append(
            '<div class="alert alert-primary" role="alert">' +
            data.data +
            "</div>"
          );
        }
      },
      error: function (request, status, error) {

        alert(request.responseJSON.data);
        JqueryFunction.Loading(0);
      },
    });
  });

  span.on("click", function () {
    modal.hide();
    $("#connectionString").empty();
  });
};
JqueryFunction.UsersValidation = async function () {

  $("#name").blur(function () {
    let name = $("#name").val();
    let stringSize = name.length;
    if (stringSize == 0) {
      $('#name').siblings("span").empty();

    } else {
      $.ajax({
        type: "post",
        url: "/user-validate",
        data: {
          name: name

        },
        success: function (data) {
          validateName = true
          if (data.statusCode == 200) {

            $('#name').siblings("span").text('Username Available').css({ 'color': 'green' });
          }
        },
        error: function (request, status, error) {

          $('#name').siblings("span").text('Sorry... Username already taken').css({ 'color': 'red' });


        },
      });
    }

  });
};

