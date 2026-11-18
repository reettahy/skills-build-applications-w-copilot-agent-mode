import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function isValidObjectId(id: unknown): boolean {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

function createError(message: string, status: number): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw createError('Invalid input', 400);
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  // Validate required fields
  if (!userId || !teamId || !type || minutes === undefined) {
    throw createError('Missing required fields: userId, teamId, type, minutes', 400);
  }

  // Validate ObjectId format
  if (!isValidObjectId(userId) || !isValidObjectId(teamId)) {
    throw createError('userId and teamId must be valid MongoDB IDs', 400);
  }

  // Validate that user and team exist
  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);

  if (!userExists || !teamExists) {
    throw createError('User or team not found', 400);
  }

  // Create activity with computed fields
  const points = Math.round((minutes as number) / 10) || 1;
  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw createError('Invalid input', 400);
  }

  const { name, mascot, members } = input as Record<string, unknown>;

  // Validate required name field
  if (!name) {
    throw createError('Team name is required', 400);
  }

  // Create team with members (default to empty array if not provided)
  const team = await Team.create({
    name,
    mascot: mascot || '',
    members: Array.isArray(members) ? members : [],
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const teamPoints = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  return teamPoints.map((entry, index) => ({
    teamName: entry.teamData.name,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Decode URL-encoded email
  const decodedEmail = decodeURIComponent(userEmail);

  // Find user by email
  const user = await User.findOne({ email: decodedEmail }).select('fitnessGoal _id');
  if (!user) {
    throw createError('User not found', 404);
  }

  // Find recent activities for this user (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentActivities = await Activity.find({
    user: user._id,
    occurredAt: { $gte: thirtyDaysAgo },
  }).select('type').lean();

  // Determine focus based on user's goal and recent activity
  let preferredFocus = user.fitnessGoal;
  if (recentActivities.length > 0) {
    const activityTypes = recentActivities.map((a) => a.type);
    // Map activity types to workout focus
    const focusMap: Record<string, string> = {
      run: 'endurance',
      cycle: 'endurance',
      walk: 'endurance',
      strength: 'strength',
      swim: 'endurance',
    };
    const recentActivityType = activityTypes[activityTypes.length - 1];
    preferredFocus = focusMap[recentActivityType] || user.fitnessGoal;
  }

  // Find workouts matching the preferred focus
  const workouts = await Workout.find({ focus: preferredFocus }).lean();

  // Add reason explaining the suggestion
  const suggestionsWithReason = workouts.map((workout) => ({
    ...workout,
    reason: `Based on your ${
      recentActivities.length > 0 ? 'recent activity' : 'fitness goal'
    } focused on ${preferredFocus}`,
  }));

  return suggestionsWithReason;
}

export { User };
