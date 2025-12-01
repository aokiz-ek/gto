import { NextRequest, NextResponse } from 'next/server';

// In production, this would store subscriptions in a database
const subscriptions = new Map<string, PushSubscription>();

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Store the subscription (in production, save to database)
    subscriptions.set(subscription.endpoint, subscription);

    console.log('[Push API] Subscription saved:', subscription.endpoint);

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('[Push API] Error saving subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return the number of active subscriptions (for admin purposes)
  return NextResponse.json({
    count: subscriptions.size,
  });
}
