"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Booking.belongsTo(models.User, {
        foreignKey: "patientId",
        targetKey: "id",
        as: "patientData",
      });

      Booking.belongsTo(models.User, {
        foreignKey: "doctorId",
        targetKey: "id",
        as: "doctorData",
      });

      Booking.belongsTo(models.Doctor_Infor, {
        foreignKey: "doctorId",
        targetKey: "doctorId",
        as: "doctorInfor",
      });

      Booking.belongsTo(models.Invoice, {
        foreignKey: "id",
        targetKey: "bookingId",
        as: "invoiceData",
      });

      Booking.belongsTo(models.Allcode, {
        foreignKey: "timeType",
        targetKey: "keyMap",
        as: "timeTypeDataPatient",
      });

      Booking.belongsTo(models.Allcode, {
        foreignKey: "statusId",
        targetKey: "keyMap",
        as: "statusDataPatient",
      });
    }
  }
  Booking.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      statusId: DataTypes.STRING,
      doctorId: DataTypes.INTEGER,
      patientId: DataTypes.INTEGER,
      date: DataTypes.STRING,
      timeType: DataTypes.STRING,
      token: DataTypes.STRING,
      imageRemedy: DataTypes.TEXT,
      patientName: DataTypes.STRING,
      patientPhoneNumber: DataTypes.STRING,
      patientAddress: DataTypes.STRING,
      patientReason: DataTypes.STRING,
      patientGender: DataTypes.STRING,
      patientBirthday: DataTypes.STRING,
      image_sheet_medical_examination_result: DataTypes.TEXT,
      pdf_sheet_medical_examination_result: DataTypes.STRING,
      pdf_remedy: DataTypes.STRING,
      clinicId:DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: "Booking",
    }
  );
  return Booking;
};
