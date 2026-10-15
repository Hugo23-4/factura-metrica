import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { etiquetaTrimestre, proximoPlazo } from '@/utils/trimestre';

/**
 * Recordatorios locales del cierre trimestral y de los gastos pendientes (RF-13).
 * Se programan en el dispositivo; las notificaciones push desde la gestoría llegarán con el backend.
 */

const DIAS_DE_AVISO = [7, 1];
const HORA_AVISO = 10;
const HORA_AVISO_PENDIENTES = 19;

const disponible = Platform.OS !== 'web';

if (disponible) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Devuelve `false` si el usuario no concede el permiso o la plataforma no lo admite. */
export async function programarRecordatorios(gastosPendientes = 0) {
  if (!disponible) return false;

  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return false;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const { trimestre, limite } = proximoPlazo(new Date());
  for (const dias of DIAS_DE_AVISO) {
    const fecha = new Date(limite);
    fecha.setDate(fecha.getDate() - dias);
    fecha.setHours(HORA_AVISO, 0, 0, 0);
    if (fecha <= new Date()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Cierre del ${etiquetaTrimestre(trimestre)}`,
        body:
          dias === 1
            ? 'Mañana termina el plazo de los modelos 303 y 130. Revisa que todos tus gastos estén justificados.'
            : `Quedan ${dias} días para el cierre trimestral. Sube los tickets que te falten.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha },
    });
  }
  if (gastosPendientes > 0) {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(HORA_AVISO_PENDIENTES, 0, 0, 0);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Tienes gastos sin justificar',
        body: `${gastosPendientes} ${gastosPendientes === 1 ? 'gasto necesita' : 'gastos necesitan'} tu respuesta para que Hacienda los acepte.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: manana },
    });
  }
  return true;
}

export async function cancelarRecordatorios() {
  if (!disponible) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
