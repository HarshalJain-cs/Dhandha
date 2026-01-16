'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('metal_types', 'metal_code', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn('metal_types', 'unit', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('metal_types', 'metal_code');
    await queryInterface.removeColumn('metal_types', 'unit');
  }
};