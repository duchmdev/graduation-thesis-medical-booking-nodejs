import db from "../models/index";
require("dotenv").config();
import _ from "lodash";
import emailService from "../services/emailService";
const textToImage = require("text-to-image");
const { Op } = require("sequelize");
const nodeHtmlToImage = require("node-html-to-image");
import { uid } from 'uid';
const PDFDocument = require('pdfkit');
const fs = require("fs");

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

const units = [
  { key: "pill", valueVi: "Viên", valueEn: "Pill" },
  { key: "package", valueVi: "Gói", valueEn: "Package" },
  { key: "bottle", valueVi: "Chai", valueEn: "Bottle" },
  { key: "tube", valueVi: "Ống", valueEn: "Tube" },
  { key: "set", valueVi: "Bộ", valueEn: "Set" },
];

let getTopDoctorHome = (dataInput) => {
  return new Promise(async (resolve, reject) => {
    try {
      let options = {
        where: { roleId: "R2" },
        order: [["createdAt", "DESC"]],
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: db.Allcode,
            as: "positionData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Allcode,
            as: "genderData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Doctor_Infor,
            attributes: ["specialtyId"],
            include: [
              {
                model: db.Specialty,
                as: "specialtyData",
                attributes: ["name"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      };

      if (dataInput.limit) options.limit = parseInt(dataInput.limit);

      let users = await db.User.findAll(options);
      let all = await db.User.findAll({
        where: { roleId: "R2" },
        attributes: {
          exclude: ["password"],
        },
        raw: true,
        nest: true,
      });
      let length=all.length;

      resolve({
        errCode: 0,
        data: users,
        length:length
      });
    } catch (e) {
      reject(e);
    }
  });
};

let getAllDoctors = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let doctors = await db.User.findAll({
        where: { roleId: "R2" },
        order: [["createdAt", "DESC"]],
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: db.Allcode,
            as: "positionData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Allcode,
            as: "genderData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Doctor_Infor,
            attributes: ["specialtyId", "provinceId"],
            include: [
              {
                model: db.Specialty,
                as: "specialtyData",
                attributes: ["name"],
              },
              {
                model: db.Allcode,
                as: "provinceTypeData",
                attributes: ["valueEn", "valueVi"],
              },
              {
                model: db.Clinic,
                as: "clinicData",
                attributes: ["name"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      });

      resolve({
        errCode: 0,
        data: doctors,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let filterDoctors = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let options = {
        where: {},
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: db.Allcode,
            as: "positionData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Allcode,
            as: "genderData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Doctor_Infor,
            attributes: ["specialtyId", "provinceId"],
            include: [
              {
                model: db.Specialty,
                as: "specialtyData",
                attributes: ["name"],
              },
              {
                model: db.Allcode,
                as: "provinceTypeData",
                attributes: ["valueEn", "valueVi"],
              },
              {
                model: db.Clinic,
                as: "clinicData",
                attributes: ["name"],
              },
            ],
          },
        ],
        raw: true,
        nest: true,
      };
      let firstName = data.firstName;
      let lastName = data.lastName;
      let role = "R2";
      let position = data.position;

      if (firstName) {
        options.where.firstName = {
          [Op.like]: "%" + firstName + "%",
        };
      }
      if (lastName) {
        options.where.lastName = {
          [Op.like]: "%" + lastName + "%",
        };
      }
      if (position) options.where.positionId = position;
      if (role) options.where.roleId = role;

      let dataDoctors = [];
      dataDoctors = await db.User.findAll(options);
      resolve({
        errCode: 0,
        data: dataDoctors,
      });
    } catch (e) {
      reject(e);
    }
  });
};

// let getAllDoctors = () => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       let doctors = await db.User.findAll({
//         where: { roleId: "R2" },
//         attributes: {
//           exclude: ["password", "image"],
//         },
//       });

//       resolve({
//         errCode: 0,
//         data: doctors,
//       });
//     } catch (e) {
//       reject(e);
//     }
//   });
// };
let checkRequiredFields = (inputData) => {
  let arrFields = [
    "doctorId",
    "contentHTML",
    "contentMarkdown",
    "action",
    "selectedPrice",
    "selectedPayment",
    "selectedProvice",
    "nameClinic",
    "addressClinic",
    "note",
    "specialtyId",
  ];

  let isValid = true;
  let element = "";
  for (let i = 0; i < arrFields.length; i++) {
    if (!inputData[arrFields[i]]) {
      isValid = false;
      element = arrFields[i];
      break;
    }
  }
  return {
    isValid: isValid,
    element: element,
  };
};

let saveDetailInforDoctor = (inputData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let checkObj = checkRequiredFields(inputData);
      if (checkObj.isValid === false) {
        resolve({
          errCode: 1,
          errMessage: `Missing parameter: ${checkObj.element}`,
        });
      } else {
        //upsert to Markdown
        if (inputData.action === "CREATE") {
          await db.Markdown.create({
            contentHTML: inputData.contentHTML,
            contentMarkdown: inputData.contentMarkdown,
            description: inputData.description,
            doctorId: inputData.doctorId,
          });
        } else if (inputData.action === "EDIT") {
          let doctorMarkdown = await db.Markdown.findOne({
            where: { doctorId: inputData.doctorId },
            raw: false,
          });

          if (doctorMarkdown) {
            doctorMarkdown.contentHTML = inputData.contentHTML;
            doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
            doctorMarkdown.description = inputData.description;
            doctorMarkdown.doctorId = inputData.doctorId;
            // doctorMarkdown.updatedAt = new Date();
            await doctorMarkdown.save();
          }
        }

        //upsert to Doctor_infor tabel
        let doctorInfor = await db.Doctor_Infor.findOne({
          where: {
            doctorId: inputData.doctorId,
          },
          raw: false,
        });

        if (doctorInfor) {
          //update
          doctorInfor.doctorId = inputData.doctorId;
          doctorInfor.priceId = inputData.selectedPrice;
          doctorInfor.provinceId = inputData.selectedProvice;
          doctorInfor.paymentId = inputData.selectedPayment;
          doctorInfor.nameClinic = inputData.nameClinic;
          doctorInfor.addressClinic = inputData.addressClinic;
          doctorInfor.note = inputData.note;
          doctorInfor.specialtyId = inputData.specialtyId;
          doctorInfor.clinicId = inputData.clinicId;

          await doctorInfor.save();
        } else {
          //create
          await db.Doctor_Infor.create({
            doctorId: inputData.doctorId,
            priceId: inputData.selectedPrice,
            provinceId: inputData.selectedProvice,
            paymentId: inputData.selectedPayment,
            nameClinic: inputData.nameClinic,
            addressClinic: inputData.addressClinic,
            note: inputData.note,
            specialtyId: inputData.specialtyId,
            clinicId: inputData.clinicId,
          });
        }
        resolve({
          errCode: 0,
          errMessage: "Save infor doctor succeed!",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getDetailDoctorById = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter!",
        });
      } else {
        let data = await db.User.findOne({
          where: { id: inputId },
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: db.Markdown,
              attributes: ["description", "contentHTML", "contentMarkdown"],
            },
            {
              model: db.Doctor_Infor,
              attributes: {
                exclude: ["id", "doctorId"],
              },
              include: [
                {
                  model: db.Allcode,
                  as: "priceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "provinceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "paymentTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Allcode,
              as: "positionData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        //convert image tu buffer sang base64
        if (data && data.image) {
          data.image = new Buffer(data.image, "base64").toString("binary");
        }

        if (!data) {
          data = {};
        }

        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let bulkCreateSchedule = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.arrSchedule || !data.doctorId || !data.date) {
        resolve({
          errCode: 1,
          errMessage: "Missing required param",
        });
      } else {
        let schedule = data.arrSchedule;
        if (schedule && schedule.length > 0) {
          schedule = schedule.map((item) => {
            item.maxNumber = MAX_NUMBER_SCHEDULE;
            return item;
          });
        }

        //get all existing data
        let existing = await db.Schedule.findAll({
          where: { doctorId: data.doctorId, date: data.date },
          attributes: ["timeType", "date", "doctorId", "maxNumber"],
          raw: true,
        });

        //convert date
        // if (existing && existing.length > 0) {
        //   existing = existing.map((item) => {
        //     item.date = new Date(item.date).getTime();
        //     return item;
        //   });
        // }

        //compare difference
        let toCreate = _.differenceWith(schedule, existing, (a, b) => {
          return a.timeType === b.timeType && +a.date === +b.date;
        });

        //create data
        if (toCreate && toCreate.length > 0) {
          await db.Schedule.bulkCreate(toCreate);
        }

        resolve({
          errCode: 0,
          errMessage: "OK",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getScheduleByDate = (doctorId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId || !date) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let dataSchedule = await db.Schedule.findAll({
          where: { doctorId: doctorId, date: date },
          include: [
            {
              model: db.Allcode,
              as: "timeTypeData",
              attributes: ["valueEn", "valueVi", "value"],
            },
            {
              model: db.User,
              as: "doctorData",
              attributes: ["id","email", "firstName","lastName"],
              include: [
                {
                  model: db.Doctor_Infor,
                  attributes: ["id","doctorId","specialtyId","clinicId"],
                  include: [
                    {
                      model: db.Specialty,
                      as: "specialtyData",
                      attributes: ["name"],
                    },
                    {
                      model: db.Clinic,
                      as: "clinicData",
                      attributes: ["name"],
                    },
                  ],
                },
              ],
            },
          ],
          raw: false,
          nest: true,
        });

        if (!dataSchedule) {
          dataSchedule = [];
        }
        resolve({
          errCode: 0,
          data: dataSchedule,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getExtraInforDoctorById = (doctorId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let data = await db.Doctor_Infor.findOne({
          where: { doctorId: doctorId },
          attributes: {
            exclude: ["id", "doctorId"],
          },
          include: [
            {
              model: db.Allcode,
              as: "priceTypeData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Allcode,
              as: "provinceTypeData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Allcode,
              as: "paymentTypeData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        if (!data) {
          data = [];
        }
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getProfileDoctorById = (doctorId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let data = await db.User.findOne({
          where: { id: doctorId },
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: db.Markdown,
              attributes: ["description", "contentHTML", "contentMarkdown"],
            },
            {
              model: db.Allcode,
              as: "positionData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Doctor_Infor,
              attributes: {
                exclude: ["id", "doctorId"],
              },
              include: [
                {
                  model: db.Allcode,
                  as: "priceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "provinceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "paymentTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
          ],
          raw: false,
          nest: true,
        });

        //convert image tu buffer sang base64
        if (data && data.image) {
          data.image = new Buffer(data.image, "base64").toString("binary");
        }

        if (!data) {
          data = {};
        }

        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getListPatientForDoctor = (doctorId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId || !date) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let data = await db.Booking.findAll({
          where: { statusId: "S4", doctorId: doctorId, date: date },
          include: [
            {
              model: db.User,
              as: "patientData",
              attributes: [
                "email",
                "firstName",
                "address",
                "gender",
                "phonenumber",
              ],
              include: [
                {
                  model: db.Allcode,
                  as: "genderData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Allcode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Invoice,
              as: "invoiceData",
              attributes: ["doctorId", "patientId", "specialtyId", "totalCost", "bookingId", "services", "image_invoice","pdf_invoice"],
            },
          ],

          
          raw: false,
          nest: true,
        });

        if (!data) {
          data = {};
        }

        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let getBookingById = (bookingId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!bookingId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let data = await db.Booking.findOne({
          where: { id: bookingId },
          include: [
            {
              model: db.User,
              as: "patientData",
              attributes: [
                "email",
                "firstName",
                "address",
                "gender",
                "phonenumber",
              ],
              include: [
                {
                  model: db.Allcode,
                  as: "genderData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Doctor_Infor,
              as: "doctorInfor",
              attributes: [
                "doctorId",
                "specialtyId",
                "clinicId",
                "priceId",
                "provinceId",
                "paymentId",
                "addressClinic",
                "nameClinic",
                "note",
                "count"
              ],
            },
            {
              model: db.Allcode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        if (!data) {
          data = {};
        }

        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let cancelBooking = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.date || !data.doctorId || !data.patientId || !data.timeType) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        //update booking status
        let appoinment = await db.Booking.findOne({
          where: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            timeType: data.timeType,
            date: data.date,
            statusId: "S2",
          },
          raw: false,
        });

        if (appoinment) {
          appoinment.statusId = "S4";
          await appoinment.save();
        }

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let sendRemedy = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        //Send email remedy
        await emailService.sendAttachment(data);

        //update to Revenue User table
        let userTotalRevenue = await db.User.findOne({
          where: { id: data.doctorId },
          raw: false,
        });

        if (userTotalRevenue) {
          userTotalRevenue.totalRevenue =
            userTotalRevenue.totalRevenue + parseInt(data.totalCost);
          await userTotalRevenue.save();
        }

        //update to totalCost User table
        let userTotalCost = await db.User.findOne({
          where: { id: data.patientId },
          raw: false,
        });
        if (userTotalCost) {
          userTotalCost.totalCost =
            userTotalCost.totalCost + parseInt(data.totalCost);
          await userTotalCost.save();
        }

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let createRemedy = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.doctorId ||
        !data.patientId ||
        !data.timeType ||
        !data.date ||
        !data.token ||
        !data.patientName ||
        !data.email ||
        !data.desciption ||
        !data.listSeletedDrugs
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let language = data.language;
      
        const remedy = {
          email: data.email,
          listMedicine: data.listMedicine,
          desciption: data.desciption,
          doctorId: data.doctorId,
          patientId: data.patientId,
          timeType: data.timeType,
          date: data.date,
          token: data.token,
          language: data.language,
          patientName: data.patientName,
          doctorName: data.doctorName,
          listSeletedDrugs: data.listSeletedDrugs,
          patientReason: data.patientReason
        };

        let doc = new PDFDocument({ size: "A4", margin: 50 });

        generateHeader(doc, language)
        generateCustomerInformationRemedy(doc, remedy, language)
        generateRemedyTable(doc, remedy, language)
        generateFooter(doc, language)
   
        doc.end();
        let nameRemedy= "remedy-"+uid()+".pdf";
        doc.pipe(fs.createWriteStream("./src/assets/pdf/remedy/"+nameRemedy));


        //create image remedy
        //get today
        // let today = new Date();
        // let dd = String(today.getDate()).padStart(2, "0");
        // let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        // let yyyy = today.getFullYear();

        // today = dd + "/" + mm + "/" + yyyy;
        // let contentImageVi = `
        // <html>
        // <body> 
        //   <h3>Thông tin đơn thuốc ngày: ${today}</h3>
        //    <h3>Bác sĩ phụ trách: ${data.doctorName}</h3>
        //   <h3>Bệnh nhân: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Tên thuốc</th>
        //         <th>Đơn vị</th>
        //         <th>Số lượng</th>
        //         <th>Hướng dẫn sử dụng</th>
        //       </tr>
        //       ${data.listSeletedDrugs.map((drug) => {
        //         return (`
        //           <tr>
        //             <td>${drug.name}</td>
        //             <td>${drug.unit}</td>
        //             <td>${drug.amount}</td>
        //             <td>${drug.description_usage}</td>
        //           </tr>`
        //         );
        //       })}
        //   </table>
        //   <h3>Thông tin thêm: ${data.desciption}</h3>
        // </body>
        // </html>
        // `;

        // let contentImageEn = `
        // <html>
        // <body> 
        //   <h3>Date prescription information: ${today}</h3>
        //    <h3>Doctor in charge: ${data.doctorName}</h3>
        //   <h3>Patient: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Drug name</th>
        //         <th>Unit</th>
        //         <th>Quantity</th>
        //         <th>User manual</th>
        //       </tr>
        //       ${data.listSeletedDrugs.map((drug) => {
        //         return (`
        //           <tr>
        //             <td>${drug.name}</td>
        //             <td>${drug.unit}</td>
        //             <td>${drug.amount}</td>
        //             <td>${drug.description_usage}</td>
        //           </tr>`
        //         );
        //       })}
        //   </table>
        //   <h3>More information: ${data.desciption}</h3>
        // </body>
        // </html>
        // `;

        // let dataUriBase64;

        // const images = await nodeHtmlToImage({
        //   html: data.language=="vi" ? contentImageVi : contentImageEn
        // });
        // let base64data = images.toString("base64");
        // dataUriBase64 = "data:image/jpeg;base64," + base64data;

        //update patient status
        let appoinment = await db.Booking.findOne({
          where: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            timeType: data.timeType,
            date: data.date,
            token: data.token,
          },
          raw: false,
        });

        if (appoinment) {
          appoinment.pdf_remedy = nameRemedy;
          await appoinment.save();
        }

        let history = await db.History.findOne({
          where: {
            token: data.token
          },
          raw: false,
        });

        if (history) {
          //update old 
          history.pdf_remedy = nameRemedy;
          await history.save();
        }else{
          //create new
            await db.History.create({
              doctorId: data.doctorId,
              patientId: data.patientId,
              description: data.desciption,
              pdf_remedy: nameRemedy,
              drugs: JSON.stringify(data.listSeletedDrugs),
              reason: data.patientReason,
              token: data.token,
            });
        }
        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

//Create sheet
let generateHeader = (doc, language) => {
  if(language=="vi"){
      doc.image('src/assets/hospital-icon.png', 50, 45, { width: 50 })
        .font("src/assets/fonts/AndikaNewBasic-R.ttf")
        .fillColor('#444444')
        .fontSize(20)
        .text('HMD Inc.', 110, 57)
        .fontSize(10)
        .text('Hồ Chí Minh, Việt Nam', 200, 65, { align: 'right' })
        .moveDown();
  }else{
      doc.image('src/assets/hospital-icon.png', 50, 45, { width: 50 })
        .font("src/assets/fonts/AndikaNewBasic-R.ttf")
        .fillColor('#444444')
        .fontSize(20)
        .text('HMD Inc.', 110, 57)
        .fontSize(10)
        .text('Ho Chi Minh, Viet Nam', 200, 65, { align: 'right' })
        .moveDown();
  }
}
let generateFooter = (doc, language) => {
  if(language=="vi"){
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fontSize(
        10,
      ).text(
        'Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.',
        50,
        750,
        { align: 'center', width: 500 },
      );
  }else{
    doc
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
    .fontSize(
      10,
    ).text(
      'Thank you for using our service.',
      50,
      750,
      { align: 'center', width: 500 },
    );
  }
}
let generateCustomerInformationSheet = (doc, sheet, language)=>{
  if(language=="vi"){
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Thông tin phiếu kết quả khám bệnh", 50, 160);

    generateHr(doc, 195);

    const customerInformationTop = 200;

    doc
    .fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
    .text(`Ngày khám: ${formatDate(new Date())}`, 50, customerInformationTop)
    .text(`Bệnh nhân: ${sheet.doctorName}`, 50, customerInformationTop + 15)
    .text(`Email bệnh nhân: ${sheet.email}`, 50, customerInformationTop + 30)
    .text(`Bác sĩ phụ trách: ${sheet.doctorName}`, 315, customerInformationTop)
    .moveDown();

    generateHr(doc, 252);
  }else{
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Information on medical examination result sheet", 50, 160);

      generateHr(doc, 195);

      const customerInformationTop = 200;

      doc
      .fontSize(10)
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .text(`Day of the examination: ${formatDate(new Date())}`, 50, customerInformationTop)
      .text(`Patient: ${sheet.doctorName}`, 50, customerInformationTop + 15)
      .text(`Patient email: ${sheet.email}`, 50, customerInformationTop + 30)
      .text(`Doctor in charge: ${sheet.doctorName}`, 315, customerInformationTop)
      .moveDown();

      generateHr(doc, 252);
  }
}
let generateTableRowSheet = (doc, y, c1, c2)=>{
	doc.fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
		.text(c1, 50, y)
		.text(c2, 150, y)
}
function generateSheetTable(doc, sheet, language) {
	let i,
		sheetTableTop = 330;

  doc.font("src/assets/fonts/AndikaNewBasic-B.ttf");

  if(language=="vi"){
    generateTableRowSheet(
      doc,
      sheetTableTop,
      "Bệnh",
      "Mô tả bệnh",
    );
  }else{
    generateTableRowSheet(
      doc,
      sheetTableTop,
      "Disease",
      "Disease's description",
    );
  }
  
  generateHr(doc, sheetTableTop + 20);
  doc.font("src/assets/fonts/AndikaNewBasic-R.ttf");

	for (i = 0; i < sheet.listDiseases.length; i++) {
		const disease = sheet.listDiseases[i];
		const position = sheetTableTop + (i + 1) * 30;
		generateTableRowSheet(
			doc,
			position,
			disease.name,
			disease.description,
		);

    generateHr(doc, position + 20);
	}
}

//Create remedy
let generateCustomerInformationRemedy = (doc, remedy, language)=>{
  if(language=="vi"){
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Thông tin đơn thuốc", 50, 160);

    generateHr(doc, 195);

    const customerInformationTop = 200;

    doc
    .fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
    .text(`Ngày lên đơn: ${formatDate(new Date())}`, 50, customerInformationTop)
    .text(`Bệnh nhân: ${remedy.patientName}`, 50, customerInformationTop + 15)
    .text(`Email bệnh nhân: ${remedy.email}`, 50, customerInformationTop + 30)
    .text(`Bác sĩ phụ trách: ${remedy.doctorName}`, 315, customerInformationTop)
    .moveDown();

    generateHr(doc, 252);
  }else{
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Prescription information", 50, 160);

      generateHr(doc, 195);

      const customerInformationTop = 200;

      doc
      .fontSize(10)
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .text(`Application date: ${formatDate(new Date())}`, 50, customerInformationTop)
      .text(`Patient: ${remedy.doctorName}`, 50, customerInformationTop + 15)
      .text(`Patient email: ${remedy.email}`, 50, customerInformationTop + 30)
      .text(`Doctor in charge: ${remedy.doctorName}`, 315, customerInformationTop)
      .moveDown();

      generateHr(doc, 252);
  }
}
let generateTableRowRemedy = (doc, y, c1, c2, c3, c4)=>{
	doc.fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
		.text(c1, 50, y)
		.text(c2, 150, y)
    .text(c3, 250, y)
    .text(c4, 350, y)
}
let getUnit = (unit)=>{
  const units = [
    {key: "pill", valueVi:"Viên", valueEn:"Pill"},
    {key: "package", valueVi:"Gói", valueEn:"Package"},
    {key: "bottle", valueVi:"Chai", valueEn:"Bottle"},
    {key: "tube", valueVi:"Ống", valueEn:"Tube"},
    {key: "set", valueVi:"Bộ", valueEn:"Set"},
  ];

  return units.find(ele => ele.key == unit)
}
let generateRemedyTable = (doc, remedy, language) => {
	let i,
		remedyTableTop = 330;

  doc.font("src/assets/fonts/AndikaNewBasic-B.ttf");

  if(language=="vi"){
    generateTableRowRemedy(
      doc,
      remedyTableTop,
      "Tên thuốc",
      "Đơn vị",
      "Số lượng",
      "Hướng dẫn sử dụng",
    );
  }else{
    generateTableRowRemedy(
      doc,
      remedyTableTop,
      "Drug name",
      "Unit",
      "Quantity",
      "User manual"
    );
  }
  
  generateHr(doc, remedyTableTop + 20);
  doc.font("src/assets/fonts/AndikaNewBasic-R.ttf");

  for (i = 0; i < remedy.listSeletedDrugs.length; i++) {
    const drug = remedy.listSeletedDrugs[i];
    const position = remedyTableTop + (i + 1) * 30;

    let unit = getUnit(drug.unit);

    generateTableRowRemedy(
      doc,
      position,
      drug.name,
      language=="vi"? unit.valueVi : unit.valueEn,
      drug.amount,
      drug.description_usage
    );

    generateHr(doc, position + 20);
  }

  let position = remedyTableTop + (remedy.listSeletedDrugs.length + 1) * 60;
  if(language=="vi"){
    doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fontSize(15)
      .text("Thông tin thêm:", 50, position)
      .text(`${remedy.desciption}`, 50, position + 15);
  }else{
    doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fontSize(15)
      .text("More descriptive information:", 50, position)
      .text(`${remedy.desciption}`, 50, position + 15);
  }
}

//Create invoice
let generateCustomerInformationInvoice = (doc, invoice, language)=>{
  if(language=="vi"){
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Hóa đơn", 50, 160);

    generateHr(doc, 195);

    const customerInformationTop = 200;

    doc
    .fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
    .text(`Ngày lên đơn: ${formatDate(new Date())}`, 50, customerInformationTop)
    .text(`Bệnh nhân: ${invoice.patientName}`, 50, customerInformationTop + 15)
    .text(`Email bệnh nhân: ${invoice.email}`, 50, customerInformationTop + 30)
    .text(`Bác sĩ phụ trách: ${invoice.doctorName}`, 315, customerInformationTop)
    .moveDown();

    generateHr(doc, 252);
  }else{
      doc
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .fillColor("#444444")
      .fontSize(20)
      .text("Invoice", 50, 160);

      generateHr(doc, 195);

      const customerInformationTop = 200;

      doc
      .fontSize(10)
      .font("src/assets/fonts/AndikaNewBasic-R.ttf")
      .text(`Application date: ${formatDate(new Date())}`, 50, customerInformationTop)
      .text(`Patient: ${invoice.doctorName}`, 50, customerInformationTop + 15)
      .text(`Patient email: ${invoice.email}`, 50, customerInformationTop + 30)
      .text(`Doctor in charge: ${invoice.doctorName}`, 315, customerInformationTop)
      .moveDown();

      generateHr(doc, 252);
  }
}
let generateTableRowInvoice = (doc, y, c1, c2)=>{
	doc.fontSize(10)
    .font("src/assets/fonts/AndikaNewBasic-R.ttf")
		.text(c1, 50, y)
		.text(c2, 150, y)
}
let generateInvoiceTable = (doc, invoice, language) => {
	let i,
		invoiceTableTop = 330;

  doc.font("src/assets/fonts/AndikaNewBasic-B.ttf");

  if(language=="vi"){
    generateTableRowInvoice(
      doc,
      invoiceTableTop,
      "Dịch vụ",
      "Thành tiền",
    );
  }else{
    generateTableRowInvoice(
      doc,
      invoiceTableTop,
      "Service",
      "Amount",
    );
  }
  
  generateHr(doc, invoiceTableTop + 20);
  doc.font("src/assets/fonts/AndikaNewBasic-R.ttf");

  for (i = 0; i < invoice.listServices.length; i++) {
    const service = invoice.listServices[i];
    const position = invoiceTableTop + (i + 1) * 30;

    generateTableRowInvoice(
      doc,
      position,
      service.name,
      service.amount,
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  if(language=="vi"){
      generateTableRowInvoice(
        doc,
        subtotalPosition,
        "Tổng phụ",
        invoice.totalAmount,
      );
  }else{
    generateTableRowInvoice(
      doc,
      subtotalPosition,
      "Subtotal",
      invoice.totalAmount,
    );
  }
}


let generateHr = (doc, y) => {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}
let randomIntFromInterval =(min, max) => { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

let formatDate = (date)=>{
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + "/" + month + "/" + year;
}

let createSheetMedicalExaminationResult = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.doctorId ||
        !data.patientId ||
        !data.timeType ||
        !data.date ||
        !data.token ||
        !data.patientName ||
        !data.email || 
        !data.listDiseases
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let language = data.language;

        const sheet = {
          doctorName: data.doctorName,
          patientName: data.patientName,
          email: data.email,
          listDiseases: data.listDiseases
        };

        // const fs = require('fs');
        // const PDFDocument = require('pdfkit');
        let doc = new PDFDocument({ size: "A4", margin: 50 });

        generateHeader(doc, language)
        generateCustomerInformationSheet(doc, sheet, language)
        generateSheetTable(doc, sheet, language)
        generateFooter(doc, language)
   
        doc.end();
        let nameSheet= "sheet-"+uid()+".pdf";
        doc.pipe(fs.createWriteStream("./src/assets/pdf/sheet/"+nameSheet));
        
        //create image sheet medical examination result
        //get today
        // let today = new Date();
        // let dd = String(today.getDate()).padStart(2, "0");
        // let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        // let yyyy = today.getFullYear();

        // today = dd + "/" + mm + "/" + yyyy;
        // let contentImageVi = `
        // <html>
        // <body> 
        //   <h3>Thông tin phiếu kết quả khám bệnh ngày: ${today}</h3>
        //    <h3>Bác sĩ phụ trách: ${data.doctorName}</h3>
        //   <h3>Bệnh nhân: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Bệnh</th>
        //         <th>Mô tả bệnh</th>
        //       </tr>
        //       ${data.listDiseases.map((disease) => {
        //         return (`
        //           <tr>
        //             <td>${disease.name}</td>
        //             <td>${disease.description}</td>
        //           </tr>`
        //         );
        //       })}
        //   </table>
        // </body>
        // </html>
        // `;

        // let contentImageEn = `
        // <html>
        // <body> 
        //   <h3>Date prescription information: ${today}</h3>
        //    <h3>Doctor in charge: ${data.doctorName}</h3>
        //   <h3>Patient: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Disease</th>
        //         <th>Disease's description</th>
        //       </tr>
        //       ${data.listDiseases.map((disease) => {
        //         return (`
        //           <tr>
        //             <td>${disease.name}</td>
        //             <td>${disease.description}</td>
        //           </tr>`
        //         );
        //       })}
        //   </table>
        // </body>
        // </html>
        // `;

        // let dataUriBase64;
        // const images = await nodeHtmlToImage({
        //   html: data.language=="vi" ? contentImageVi : contentImageEn
        // });
        // let base64data = images.toString("base64");
        // dataUriBase64 = "data:image/jpeg;base64," + base64data;


        //update patient status
        let appoinment = await db.Booking.findOne({
          where: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            timeType: data.timeType,
            date: data.date,
            token: data.token,
          },
          raw: false,
        });

        if (appoinment) {
          // appoinment.image_sheet_medical_examination_result = dataUriBase64;
          appoinment.pdf_sheet_medical_examination_result = nameSheet;
          await appoinment.save();
        }

        let history = await db.History.findOne({
          where: {
            token: data.token
          },
          raw: false,
        });

        if (history) {
          //update old 
          // history.image_sheet_medical_examination_result = dataUriBase64;
          history.pdf_sheet_medical_examination_result = nameSheet;
          await history.save();
        }else{
          //create new
            await db.History.create({ 
              doctorId: data.doctorId,
              patientId: data.patientId,
              reason: data.patientReason,
              // image_sheet_medical_examination_result: dataUriBase64,
              pdf_sheet_medical_examination_result: nameSheet,
              token: data.token,
            });
        }

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let sendSheet = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        //update patient status
        // let appoinment = await db.Booking.findOne({
        //   where: {
        //     doctorId: data.doctorId,
        //     patientId: data.patientId,
        //     timeType: data.timeType,
        //     statusId: "S2",
        //   },
        //   raw: false,
        // });

        // if (appoinment) {
        //   appoinment.statusId = "S6";
        //   await appoinment.save();
        // }
        
        //send email sheet
        await emailService.sendSheet(data);

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let sendInvoice = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        //update booking status to Done
        let appoinment = await db.Booking.findOne({
          where: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            timeType: data.timeType,
            statusId: "S2",
          },
          raw: false,
        });

        if (appoinment) {
          appoinment.statusId = "S6";
          await appoinment.save();
        }

        //send email invoice
        await emailService.sendInvoice(data);

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

let createInvoice = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.doctorId ||
        !data.patientId ||
        !data.timeType ||
        !data.date ||
        !data.token ||
        !data.patientName ||
        !data.email || 
        !data.listServices
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter",
        });
      } else {
        let language = data.language;

        const invoiceData = {
          email: data.email,
          doctorId: data.doctorId,
          patientId: data.patientId,
          timeType: data.timeType,
          date: data.date,
          token: data.token,
          language: data.language,
          patientName: data.patientName,
          doctorName: data.doctorName,
          patientReason: data.patientReason,
          listServices: data.listServices,
          totalAmount: data.totalAmount,
          bookingId: data.bookingId,
          specialtyId: data.specialtyId
        };

        let doc = new PDFDocument({ size: "A4", margin: 50 });

        generateHeader(doc, language)
        generateCustomerInformationInvoice(doc, invoiceData, language)
        generateInvoiceTable(doc, invoiceData, language)
        generateFooter(doc, language)
   
        doc.end();
        let nameInvoice= "invoice-"+uid()+".pdf";
        doc.pipe(fs.createWriteStream("./src/assets/pdf/invoice/"+nameInvoice));

        //create image invoice
        //get today
        // let today = new Date();
        // let dd = String(today.getDate()).padStart(2, "0");
        // let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
        // let yyyy = today.getFullYear();

        // today = dd + "/" + mm + "/" + yyyy;
        // let contentImageVi = `
        // <html>
        // <body> 
        //   <h3>Thông tin hóa đơn khám bệnh ngày: ${today}</h3>
        //   <h3>Bác sĩ phụ trách: ${data.doctorName}</h3>
        //   <h3>Bệnh nhân: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Dịch vụ</th>
        //         <th>Thành tiền(VND)</th>
        //       </tr>
        //       ${data.listServices.map((service) => {
        //         return (`
        //           <tr>
        //             <td>${service.name}</td>
        //             <td>${service.amount*23} VND</td>
        //           </tr>`
        //         );
        //       })}
        //       <tr>
        //         <td>Tổng tiền</td>
        //         <td>${data.totalAmount*23} VND</td>
        //       </tr>
        //   </table>
        // </body>
        // </html>
        // `;

        // let contentImageEn = `
        // <html>
        // <body> 
        //   <h3>Information on medical examination bill date: ${today}</h3>
        //    <h3>Doctor in charge: ${data.doctorName}</h3>
        //   <h3>Patient: ${data.patientName}</h3>
        //   <h3>Email: ${data.email}</h3>
        //    <table border="1">
        //       <tr>
        //         <th>Service</th>
        //         <th>Amount</th>
        //       </tr>
        //       ${data.listServices.map((service) => {
        //         return (`
        //           <tr>
        //             <td>${service.name}</td>
        //             <td>${service.amount} $</td>
        //           </tr>`
        //         );
        //       })}
        //       <tr>
        //         <td>Total amount</td>
        //         <td>${data.totalAmount} $</td>
        //       </tr>
        //   </table>
        // </body>
        // </html>
        // `;
        // let dataUriBase64;

        // const images = await nodeHtmlToImage({
        //   html: data.language=="vi" ? contentImageVi : contentImageEn
        // });
        // let base64data = images.toString("base64");
        // dataUriBase64 = "data:image/jpeg;base64," + base64data;

        //update invoice
        let invoice = await db.Invoice.findOne({
          where: {
            bookingId: data.bookingId,
          },
          raw: false,
        });

        if (invoice) {
          //update old
          invoice.doctorId = data.doctorId;
          invoice.patientId = data.patientId;
          invoice.specialtyId = data.specialtyId;
          invoice.totalCost = data.totalAmount ? data.totalAmount : 0;
          invoice.bookingId = data.bookingId;
          invoice.services = JSON.stringify(data.listServices);
          invoice.pdf_invoice = nameInvoice;
          await invoice.save();
        }else{
            //Create new
            await db.Invoice.create({
              doctorId: data.doctorId,
              patientId: data.patientId,
              specialtyId: data.specialtyId,
              totalCost: data.totalAmount ? data.totalAmount : 0,
              pdf_invoice: nameInvoice,
              bookingId: data.bookingId,
              services: JSON.stringify(data.listServices)
            });
        }

        resolve({
          errCode: 0,
          errMessage: "ok",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};


module.exports = {
  getTopDoctorHome: getTopDoctorHome,
  getAllDoctors: getAllDoctors,
  saveDetailInforDoctor: saveDetailInforDoctor,
  getDetailDoctorById: getDetailDoctorById,
  bulkCreateSchedule: bulkCreateSchedule,
  getScheduleByDate: getScheduleByDate,
  getExtraInforDoctorById: getExtraInforDoctorById,
  getProfileDoctorById: getProfileDoctorById,
  getListPatientForDoctor: getListPatientForDoctor,
  sendRemedy: sendRemedy,
  cancelBooking: cancelBooking,
  createRemedy: createRemedy,
  getBookingById: getBookingById,
  filterDoctors: filterDoctors,
  createSheetMedicalExaminationResult:createSheetMedicalExaminationResult,
  sendSheet:sendSheet,
  createInvoice:createInvoice,
  sendInvoice:sendInvoice,
};
