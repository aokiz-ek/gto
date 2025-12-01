import { NextRequest, NextResponse } from 'next/server';

// This would share storage with subscribe route in production
const subscriptions = new Map<string, PushSubscription>();

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Remove the subscription
    subscriptions.delete(endpoint);

    console.log('[Push API] Subscription removed:', endpoint);

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully',
    });
  } catch (error) {
    console.error('[Push API] Error removing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
