"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "bookings", // table name
        "pdf_sheet_medical_examination_result", // new field name
        {
          type: Sequelize.STRING,
          allowNull: true,
        }
      ),
      queryInterface.addColumn(
        "bookings", // table name
        "pdf_remedy", // new field name
        {
          type: Sequelize.STRING,
          allowNull: true,
        }
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
        queryInterface.removeColumn("bookings", "pdf_sheet_medical_examination_result"),
        queryInterface.removeColumn("bookings", "pdf_remedy")
    ]);
  },
};
