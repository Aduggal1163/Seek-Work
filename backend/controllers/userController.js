import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/emailService.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !phone || !password || !role) {
    return next(new ErrorHandler("Please fill all the fields!"));
  }
  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!"));
  }
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
  });

  await sendEmail(email, 'Registration Successful', `Welcome ${name}, you have successfully registered in Seek&Work!`);

  sendToken(user, 201, res, "User Registered Successfully!");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email ,password and role."));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }
  if (user.role !== role) {
    return next(
      new ErrorHandler(`User with provided email and ${role} not found!`, 404)
    );
  }

  // await sendEmail(email, 'Login Successful', `Hello ${user.name}, you have successfully logged in!`);

  sendToken(user, 201, res, "User Logged In!");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully.",
    });
});


export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  // Fetch all users from the database
  const users = await User.find(); // No filter to fetch all users

  if (!users || users.length === 0) {
    return next(new ErrorHandler("No users found", 404)); // Handle case if no users exist
  }

  res.status(200).json({
    success: true,
    users, // Return the users in the response
  });
});

export const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params; // Get the userId from the request parameters
// console.log(userId)
  // Check if user exists in the database
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found", 404)); // Handle if user doesn't exist
  }

  // Delete the user from the database
  // await user.remove();
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: "User deleted successfully!",
  });
});