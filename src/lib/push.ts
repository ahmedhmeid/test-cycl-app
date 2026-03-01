// [CYCL:2e0ff9ca] Initialize web-push with VAPID keys and provide sendPushNotification utility
import webPush from 'web-push'

webPush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: object
) {
  return webPush.sendNotification(subscription, JSON.stringify(payload))
}

export { webPush }
