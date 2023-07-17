"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "invoices", // table name
        "image_invoice", // new field name
        {
          type: Sequelize.BLOB("long"),
          allowNull: true,
        }
      ),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
        queryInterface.removeColumn("invoices", "image_invoice"),
    ]);
  },
};
