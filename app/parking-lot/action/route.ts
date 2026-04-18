import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostHogClient } from '@/lib/posthog-server';

type ParkingLotAction = 'publish' | 'archive' | 'unarchive';

const ACTION_TO_STATUS: Record<ParkingLotAction, 'active' | 'archived'> = {
  publish: 'active',
  archive: 'archived',
  unarchive: 'active',
};

const ALLOWED_PRIOR_STATUSES: Record<ParkingLotAction, ReadonlyArray<string>> = {
  publish: ['draft'],
  archive: ['active'],
  unarchive: ['archived'],
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    const listing_id = formData.get('listing_id') as string | null;
    const user_id = formData.get('user_id') as string | null;
    const action = formData.get('action') as string | null;

    if (!listing_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing listing_id or user_id.' },
        { status: 400 },
      );
    }
    if (!action || !(action in ACTION_TO_STATUS)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action.' },
        { status: 400 },
      );
    }

    const typedAction = action as ParkingLotAction;

    const { data: listing, error: fetchError } = await supabase
      .from('listing')
      .select('seller_id, status')
      .eq('listing_id', listing_id)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found.' },
        { status: 404 },
      );
    }

    if (listing.seller_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to modify this listing.' },
        { status: 403 },
      );
    }

    const currentStatus: string = listing.status ?? 'active';
    if (!ALLOWED_PRIOR_STATUSES[typedAction].includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot ${typedAction} a listing that is currently '${currentStatus}'.`,
        },
        { status: 409 },
      );
    }

    const newStatus = ACTION_TO_STATUS[typedAction];

    const { error: updateError } = await supabase
      .from('listing')
      .update({ status: newStatus })
      .eq('listing_id', listing_id);

    if (updateError) {
      console.error('Error updating listing status:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 },
      );
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user_id,
      event: `listing_${typedAction}d_server`,
      properties: {
        listing_id,
        prior_status: currentStatus,
        new_status: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      listing_id,
      status: newStatus,
    });
  } catch (error) {
    console.error('Unexpected error in POST /parking-lot/action:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
