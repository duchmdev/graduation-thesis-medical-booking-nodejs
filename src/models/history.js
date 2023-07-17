"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class History extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      History.belongsTo(models.User, {
          foreignKey: "doctorId",
          targetKey: "id",
          as: "doctorDataHistory",
      });

      History.hasOne(models.Booking, { 
        sourceKey: 'token',
        foreignKey: "token" 
      });
    }
  }
  History.init(
    {
      patientId: DataTypes.INTEGER,
      doctorId: DataTypes.INTEGER,
      description: DataTypes.TEXT,
      files: DataTypes.TEXT,
      drugs: DataTypes.TEXT,
      reason: DataTypes.STRING,
      createdAt:DataTypes.DATE,
      updatedAt:DataTypes.DATE,
      image_sheet_medical_examination_result:DataTypes.TEXT,
      token: DataTypes.STRING,
      pdf_sheet_medical_examination_result: DataTypes.STRING,
      pdf_remedy: DataTypes.STRING
    },
    {
      sequelize,
      modelName: "History",
    }
  );
  return History;
};
