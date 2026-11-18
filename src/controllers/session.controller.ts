import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { ApiResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export class SessionController {
  public static createSession = asyncHandler(async (req: Request, res: Response) => {
    const session = await SessionService.createSession(req.body);
    res.status(201).json(new ApiResponse(201, session, 'Session created successfully'));
  });

  public static getAvailableSessions = asyncHandler(async (req: Request, res: Response) => {
    const { dateTimestamp } = req.query as { dateTimestamp: string };
    const sessions = await SessionService.getAvailableSessions(dateTimestamp);
    res.status(200).json(new ApiResponse(200, sessions, 'Available sessions retrieved successfully'));
  });

  public static bookSession = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { userId } = req.body;
    const session = await SessionService.bookSession(id, userId);
    res.status(200).json(new ApiResponse(200, session, 'Session booked successfully'));
  });

  public static completeSession = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const session = await SessionService.completeSession(id);
    res.status(200).json(new ApiResponse(200, session, 'Session marked as completed successfully'));
  });
}
