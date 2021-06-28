require('dotenv').config();
const jwt = require('jsonwebtoken');

const usersModel = require('../repository/users');
const { HttpCode } = require('../helpers/constants');
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

const getAllUsers = async (req, res, next) => {
  try {
    // const {
    //   users,
    //    total, limit, offset
    // } =
    // const userId = req.users._id;filter
    const { users, total, limit, offset } = await usersModel.getAll(
      // userId,
      req.query,
    );
    return res.status(HttpCode.OK).json({
      status: 'succes',
      code: HttpCode.OK,
      data: { users, total, limit, offset },
    });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  try {
    const user = await usersModel.findByEmail(req.body.email);

    if (user) {
      return res.status(HttpCode.CONFLICT).json({
        status: 'error',
        code: HttpCode.CONFLICT,
        message: 'Email is in use',
      });
    }
    const newUser = await usersModel.create(req.body);
    console.log(`here shoul be user ${newUser}`);
    const { id, name, email } = newUser;
    return res.status(HttpCode.CREATED).json({
      status: 'success',
      code: HttpCode.CREATED,
      data: { id, name, email },
    });
  } catch (error) {
    next(error);
  }
};

const findEmail = async (req, res, next) => {
  try {
    const user = await usersModel.findByEmail(req.body.email);
    const { id, name, email } = user;
    if (user) {
      return res.status(HttpCode.OK).json({
        status: 'success',
        code: HttpCode.OK,
        data: { id, name, email },
      });
    }
    return res.status(HttpCode.CONFLICT).json({
      status: 'error',
      code: HttpCode.CONFLICT,
      message: 'Email is not found',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await usersModel.findByEmail(email);
    const isValidPassword = await user?.validPassword(password);
    if (!user || !isValidPassword) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: 'error',
        code: HttpCode.UNAUTHORIZED,
        message: 'Email or password is wrong',
      });
    }
    const payload = { _id: user.id };
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '2h' });
    await usersModel.updateToken(user.id, token);
    return res.status(HttpCode.OK).json({
      status: 'success',
      code: HttpCode.OK,
      data: {
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await usersModel.getUserByToken(req.params.token);
    const { name, email } = req.user;
    if (!user) {
      return res.status(HttpCode.UNAUTHORIZED).json({
        status: 'error',
        code: HttpCode.UNAUTHORIZED,
        message: 'User is not authorized',
      });
    }
    return res.status(HttpCode.OK).json({
      status: 'succes',
      code: HttpCode.OK,
      data: { name, email },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await usersModel.updateToken(req.user.id, null);
    return res.status(HttpCode.NO_CONTENT).json({});
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  findEmail,
  getCurrentUser,
  getAllUsers,
};
