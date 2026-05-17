import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User, IUserDocument } from "./user.model";
import { AppError } from "../../middleware/error.middleware";

// This interface defines exactly what data is needed to register an owner
// TypeScript will error if the controller passes anything different
interface RegisterOwnerInput {
  name: string;
  email: string;
  password: string;
}

export const authService = {

  // Check if any owner already exists in the system
  // Returns true if owner exists, false if not
  async isOwnerRegistered(): Promise<boolean> {
    const owner = await User.findOne({ role: "owner" });
    return owner !== null;
  },

  // Register the first owner of the system
  // Can only run once - if owner exists, throws an error
  async registerOwner(input: RegisterOwnerInput): Promise<IUserDocument> {

    // Check if owner already exists
    const ownerExists = await this.isOwnerRegistered();
    if (ownerExists) {
      throw new AppError("Owner account already exists", 409);
    }

    // Check if email is already taken
    const emailTaken = await User.findOne({ email: input.email.toLowerCase() });
    if (emailTaken) {
      throw new AppError("Email is already registered", 409);
    }

    // Hash the password before saving
    // Never save plain text password to database
    const hashedPassword = await bcrypt.hash(input.password, 10);

    // Create a placeholder businessId for now
    // This will be replaced when we build the business settings module
    const placeholderBusinessId = new mongoose.Types.ObjectId();

    // Create and save the owner user
    const owner = await User.create({
      businessId: placeholderBusinessId,
      name: input.name,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: "owner",
      isActive: true,
    });

    return owner;
  },
};
