import { mysqlDatabase } from '@jobber/mysql.database';
import { IContactUsDocument } from '@jobber/shared';
import { DataTypes, ModelDefined, Optional } from 'sequelize';

type ContactUsUserCreationAttributes = Optional<IContactUsDocument, 'id' | 'createdAt'>;

const ContactUsModel: ModelDefined<IContactUsDocument, ContactUsUserCreationAttributes> | any = mysqlDatabase.sequelize.define(
  'contact',
  {
    title: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: Date.now
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['email']
      }
    ]
  }
);

// force: true always deletes the table when there is a server restart
ContactUsModel.sync({});
export { ContactUsModel };
