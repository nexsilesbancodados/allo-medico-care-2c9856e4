/**
 * Jitsi Meet integration utilities for AloClínica teleconsultation.
 */

export const JITSI_BASE_URL = "https://meet.telemedicinaaloclinica.sbs";

export function gerarRoomId(appointmentId: string): string {
  return `consulta-${appointmentId}-${Date.now()}`;
}

export function getJitsiUrl(roomId: string, displayName: string): string {
  const encodedName = encodeURIComponent(displayName);
  const configParams = [
    "config.startWithAudioMuted=false",
    "config.startWithVideoMuted=false",
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    'interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","hangup","chat","tileview"]',
  ].join("&");

  return `${JITSI_BASE_URL}/${roomId}?userInfo.displayName=${encodedName}#${configParams}`;
}
