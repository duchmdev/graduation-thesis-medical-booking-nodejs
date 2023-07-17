"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "bookings", // table name
        "image_sheet_medical_examination_result", // new field name
        {
          type: Sequelize.BLOB("long"),
          allowNull: true,
        }
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
                queryInterface.removeColumn("bookings", "image_sheet_medical_examination_result"),
    ]);
  },
};
