"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "drugs", // table name
        "unit", // new field name
        {
          type: Sequelize.STRING,
          allowNull: true,
        }
      )
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("drugs", "unit")
    ]);
  },
};
