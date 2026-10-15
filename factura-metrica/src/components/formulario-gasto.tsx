import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Boton } from '@/components/boton';
import { CampoTexto } from '@/components/campo-texto';
import { Chips } from '@/components/chips';
import { FilaDato } from '@/components/fila-dato';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { LISTA_CATEGORIAS, TIPOS_IVA } from '@/constants/fiscal';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { redondear } from '@/services/ocr';
import { evaluarGasto } from '@/services/reglas-fiscales';
import type { Categoria, DatosExtraidos } from '@/types/gasto';
import { formatearImporte, NOMBRE_CATEGORIA } from '@/utils/formato';
import { esNifValido } from '@/utils/nif';

const ETIQUETA_SEMAFORO = {
  verde: 'Deducible',
  amarillo: 'Necesitará justificación',
  rojo: 'No deducible',
} as const;

interface FormularioGastoProps {
  inicial: DatosExtraidos;
  notaInicial?: string;
  /** NIF del autónomo, que figura como receptor en las facturas completas. Sin sesión, uno ficticio. */
  nifAutonomo?: string;
  textoGuardar: string;
  onGuardar: (datos: DatosExtraidos, nota?: string) => void;
}

/**
 * Revisión y corrección de los datos extraídos por el OCR.
 * El semáforo se recalcula en tiempo real con el motor de reglas fiscales.
 */
export function FormularioGasto({
  inicial,
  notaInicial,
  nifAutonomo = '00000000T',
  textoGuardar,
  onGuardar,
}: FormularioGastoProps) {
  const theme = useTheme();
  const fechaInicial = new Date(inicial.fechaEmision);

  const [razonSocial, setRazonSocial] = useState(inicial.razonSocialEmisor);
  const [nifEmisor, setNifEmisor] = useState(inicial.nifEmisor ?? '');
  const [fecha, setFecha] = useState(
    fechaInicial.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
  );
  const [hora, setHora] = useState(
    fechaInicial.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  );
  const [categoria, setCategoria] = useState<Categoria>(inicial.categoria);
  const [tipoIva, setTipoIva] = useState<number>(inicial.tipoIva);
  const [base, setBase] = useState(String(inicial.baseImponible).replace('.', ','));
  const [facturaCompleta, setFacturaCompleta] = useState(inicial.nifReceptor !== null);
  const [nota, setNota] = useState(notaInicial ?? '');

  const fechaEmision = leerFecha(fecha, hora);
  const baseImponible = Number(base.replace(',', '.'));
  const baseValida = base.trim() !== '' && Number.isFinite(baseImponible) && baseImponible >= 0;
  const nifIncorrecto = nifEmisor.trim() !== '' && !esNifValido(nifEmisor);
  const cuotaIva = baseValida ? redondear((baseImponible * tipoIva) / 100) : 0;

  const datos: DatosExtraidos = {
    fechaEmision: fechaEmision?.toISOString() ?? inicial.fechaEmision,
    nifEmisor: nifEmisor.trim() ? nifEmisor.trim().toUpperCase() : null,
    razonSocialEmisor: razonSocial.trim(),
    nifReceptor: facturaCompleta ? nifAutonomo : null,
    baseImponible: baseValida ? baseImponible : 0,
    tipoIva,
    cuotaIva,
    total: baseValida ? redondear(baseImponible + cuotaIva) : 0,
    categoria,
    tipoDocumento: inicial.tipoDocumento,
  };
  const evaluacion = evaluarGasto(datos);
  const color = theme[evaluacion.semaforo];
  const valido = razonSocial.trim() !== '' && baseValida && fechaEmision !== null && !nifIncorrecto;

  return (
    <View style={styles.formulario}>
      <View
        style={[styles.vistaPrevia, { backgroundColor: `${color}12`, borderColor: `${color}66` }]}>
        <View style={[styles.punto, { backgroundColor: color }]} />
        <View style={styles.flex}>
          <ThemedText type="smallBold" style={{ color }}>
            {ETIQUETA_SEMAFORO[evaluacion.semaforo]}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {evaluacion.motivoRiesgo ?? 'El comprobante cumple los requisitos para deducirse.'}
          </ThemedText>
        </View>
      </View>

      <CampoTexto
        etiqueta="Emisor"
        value={razonSocial}
        onChangeText={setRazonSocial}
        placeholder="Razón social del establecimiento"
        error={razonSocial.trim() === '' && 'Indica quién emite el comprobante.'}
      />
      <CampoTexto
        etiqueta="NIF del emisor"
        value={nifEmisor}
        onChangeText={setNifEmisor}
        placeholder="B06123456"
        autoCapitalize="characters"
        autoCorrect={false}
        error={nifIncorrecto && 'El NIF no tiene un formato válido.'}
      />

      <View style={styles.filaCampos}>
        <View style={styles.flex}>
          <CampoTexto
            etiqueta="Fecha"
            value={fecha}
            onChangeText={setFecha}
            placeholder="dd/mm/aaaa"
            keyboardType="numbers-and-punctuation"
            error={fechaEmision === null && 'Fecha u hora no válidas.'}
          />
        </View>
        <View style={styles.hora}>
          <CampoTexto
            etiqueta="Hora"
            value={hora}
            onChangeText={setHora}
            placeholder="hh:mm"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      <View style={styles.grupo}>
        <ThemedText type="smallBold">Categoría</ThemedText>
        <Chips
          opciones={LISTA_CATEGORIAS.map((valor) => ({
            valor,
            etiqueta: NOMBRE_CATEGORIA[valor],
          }))}
          valor={categoria}
          onCambio={setCategoria}
        />
      </View>

      <CampoTexto
        etiqueta="Base imponible (€)"
        value={base}
        onChangeText={setBase}
        placeholder="0,00"
        keyboardType="decimal-pad"
        error={!baseValida && 'Introduce un importe válido.'}
      />

      <View style={styles.grupo}>
        <ThemedText type="smallBold">Tipo de IVA</ThemedText>
        <Chips
          opciones={TIPOS_IVA.map((valor): { valor: number; etiqueta: string } => ({
            valor,
            etiqueta: `${valor} %`,
          }))}
          valor={tipoIva}
          onCambio={setTipoIva}
        />
      </View>

      <Tarjeta variante="relleno">
        <FilaDato
          etiqueta={`Cuota de IVA (${tipoIva} %)`}
          valor={formatearImporte(datos.cuotaIva)}
        />
        <FilaDato etiqueta="Total" valor={formatearImporte(datos.total)} />
        <FilaDato etiqueta="Cuenta PGC propuesta" valor={evaluacion.cuentaPgc} />
      </Tarjeta>

      <View style={styles.interruptor}>
        <View style={styles.flex}>
          <ThemedText type="smallBold">Factura completa con mis datos</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Actívalo si el comprobante incluye tu nombre y NIF como receptor.
          </ThemedText>
        </View>
        <Switch
          value={facturaCompleta}
          onValueChange={setFacturaCompleta}
          trackColor={{ true: theme.primary, false: theme.border }}
        />
      </View>

      <CampoTexto
        etiqueta="Nota para tu gestor (opcional)"
        value={nota}
        onChangeText={setNota}
        placeholder="Cualquier detalle que deba saber tu asesoría"
        multiline
      />

      <Boton
        titulo={textoGuardar}
        disabled={!valido}
        onPress={() => onGuardar(datos, nota.trim() || undefined)}
      />
    </View>
  );
}

/** Convierte "dd/mm/aaaa" y "hh:mm" en una fecha local, o `null` si no es válida. */
function leerFecha(fecha: string, hora: string) {
  const f = fecha.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const h = hora.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!f || !h) return null;

  const [dia, mes, anio, horas, minutos] = [f[1], f[2], f[3], h[1], h[2]].map(Number);
  const resultado = new Date(anio, mes - 1, dia, horas, minutos);
  const coincide =
    resultado.getDate() === dia && resultado.getMonth() === mes - 1 && horas < 24 && minutos < 60;
  return coincide && resultado <= new Date() ? resultado : null;
}

const styles = StyleSheet.create({
  formulario: {
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  vistaPrevia: {
    flexDirection: 'row',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  filaCampos: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  hora: {
    width: 110,
  },
  grupo: {
    gap: Spacing.two,
  },
  interruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
});
