import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class UserController {
  public static createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.createUser(req.body);
    res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
  });

  public static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = await UserService.getUserById(id);
    res.status(200).json(new ApiResponse(200, user));
  });

  public static getUserSessions = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const sessions = await UserService.getUserSessions(id);
    res.status(200).json(new ApiResponse(200, sessions, 'User sessions retrieved successfully'));
  });
}
