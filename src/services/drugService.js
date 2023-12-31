import db from "../models/index";
const { Op } = require("sequelize");

let createNewDrug = async (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.Drug.create({
        name: data.name,
        unit: data.unit,
      });

      resolve({
        errCode: 0,
      });
    } catch (e) {
      reject(e);
    }
  });
};

let filter = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      //name
      let drugs = await db.Drug.findAll({
          where: {
            [Op.or]: [{
                    name: {
                        [Op.like]: `%${data.name}%`
                    }
                }
            ]
          }
      });

      resolve(drugs);
    } catch (e) {
      reject(e);
    }
  });
};

let getDrugInfoById = (drugId) => {

  return new Promise(async (resolve, reject) => {
    try {
      let drug = await db.Drug.findOne({
        where: { id: drugId },
        raw: true,
      });

      if (drug) {
        resolve(drug);
      } else {
        resolve({});
      }
    } catch (e) {
      reject(e);
    }
  });
};

let udateDrugData = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      let drug = await db.Drug.findOne({
        where: { id: data.id },
        raw: false,
      });
      if (drug) {
        drug.name = data.name;
        drug.unit = data.unit;

        await drug.save();

        resolve({
          errCode:0
        });
      } else {
        resolve();
      }
    } catch (e) {
      reject(e);
    }
  });
};

let deleteDrugById = (drugId) => {
  return new Promise(async (resolve, reject) => {
    try {
      await db.Drug.destroy({
        where: {
          id: drugId
        }
      });
      resolve({
        errCode:0
      });
    } catch (e) {
      reject(e);
    }
  });
};
module.exports = {
  deleteDrugById: deleteDrugById,
  udateDrugData: udateDrugData,
  getDrugInfoById: getDrugInfoById,
  createNewDrug: createNewDrug,
  filter:filter
};
