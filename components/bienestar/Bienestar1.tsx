import {StyleSheet} from 'react-native';
import {View, Text, TextInput, ScrollView, Pressable} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import type {ViewStyle, StyleProp} from 'react-native';

export interface Bienestar1Props {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>,
  /** Used to locate this view in end-to-end tests. */
  testID?: string,
  onTabChange?: (index: 1 | 2 | 3 | 4) => void,
}

export function Bienestar1(props: Bienestar1Props) {
  const router = useRouter();
  return (
    <View testID={props.testID ?? "113:252"} style={[styles.root, props.style]}>
      <View testID="59:549" style={styles.container}>
        <View testID="59:550" style={styles.bienestarTab}>
          <View testID="59:551" style={styles.container2}>
          </View>
          <View testID="59:552" style={styles.container3}>
          </View>
          <View testID="59:553" style={styles.container4}>
          </View>
          <View testID="59:554" style={styles.container5}>
          </View>
          <View testID="59:555" style={styles.container6}>
          </View>
          <View testID="59:556" style={styles.container7}>
          </View>
          <View testID="59:557" style={styles.container8}>
            <View testID="59:558" style={styles.container9}>
              <Text testID="59:559" style={styles.__}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:560" style={styles.container10}>
              <Text testID="59:561" style={styles.__2}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:562" style={styles.container11}>
              <Text testID="59:563" style={styles.__3}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:564" style={styles.container12}>
              <Text testID="59:565" style={styles.__4}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:566" style={styles.container13}>
              <Text testID="59:567" style={styles.__5}>
                {`🐾`}
              </Text>
            </View>
          </View>

          <View testID="59:581" style={styles.container16}>
            <View testID="59:582" style={styles.monoChat}>
              <View testID="59:583" style={styles.container17}>
                <View testID="59:584" style={styles.container18}>
                  <View testID="59:585" style={styles.monoAvatar}>
                    <View testID="59:586" style={styles.margin}>
                      <View testID="59:587" style={styles.text}>
                        <Text testID="59:588" style={styles.__6}>
                          {`🐕`}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View testID="59:589" style={styles.container19}>
                  </View>
                  <View testID="59:590" style={styles.container20}>
                  </View>
                </View>
                <View testID="59:591" style={styles.container21}>
                  <View testID="59:592" style={styles.container22}>
                    <View testID="59:593" style={styles.heading2}>
                      <Text testID="59:594" style={styles.mono2}>
                        {`Mono`}
                      </Text>
                    </View>
                    <View testID="59:595" style={styles.text2}>
                      <Text testID="59:596" style={styles.enLinea}>
                        {`en línea`}
                      </Text>
                    </View>
                  </View>
                  <View testID="59:597" style={styles.paragraph}>
                    <Text testID="59:598" style={styles.tuCompaneroDeBienestarSiempreAqui__}>
                      {`Tu compañero de bienestar · siempre aquí 🐾`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:599" style={styles.margin2}>
                <View testID="59:600" style={styles.container23}>
                  <View testID="59:601" style={styles.text3}>
                    <Text testID="59:602" style={styles._}>
                      {`✨`}
                    </Text>
                  </View>
                  <View testID="59:603" style={styles.paragraph2}>
                    <Text testID="59:604" style={styles.espacioSeguroSoloEntreTuYMono}>
                      {`Espacio seguro — solo entre tú y Mono.`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View testID="59:605" style={styles.monoChat2}>
              <View testID="59:606" style={styles.container24}>
                <View testID="59:607" style={styles.monoAvatar2}>
                  <View testID="59:608" style={styles.text4}>
                    <Text testID="59:609" style={styles.__7}>
                      {`🐕`}
                    </Text>
                  </View>
                </View>
                <View testID="59:610" style={styles.container25}>
                  <View testID="59:611" style={styles.container26}>
                    <Text testID="59:612" style={styles.holaSoyMono__TuCompaneroDeBienestarEnLa}>
                      {`¡Hola! Soy Mono 🐾 Tu compañero de bienestar en la ECI. Estoy aquí para escucharte cuando lo necesites — sin juicios, solo con mucha atención.`}
                    </Text>
                  </View>
                  <View testID="59:613" style={styles.text5}>
                    <Text testID="59:614" style={styles.$49AM}>
                      {`09:49 a. m.`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:615" style={styles.container27}>
                <View testID="59:616" style={styles.monoAvatar3}>
                  <View testID="59:617" style={styles.text6}>
                    <Text testID="59:618" style={styles.__8}>
                      {`🐕`}
                    </Text>
                  </View>
                </View>
                <View testID="59:619" style={styles.container28}>
                  <View testID="59:620" style={styles.container29}>
                    <Text testID="59:621" style={styles.comoEstasHoyCuentameLoQueSea__}>
                      {`¿Cómo estás hoy? Cuéntame lo que sea 💛`}
                    </Text>
                  </View>
                  <View testID="59:622" style={styles.text7}>
                    <Text testID="59:623" style={styles.$49AM2}>
                      {`09:49 a. m.`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View testID="59:624" style={styles.monoChat3}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                <Pressable testID="59:626" style={styles.button6}>
                  <Text testID="59:627" style={styles.meSientoEstresado__}>
                    {`Me siento estresado 😓`}
                  </Text>
                </Pressable>
                <Pressable testID="59:628" style={styles.button7}>
                  <Text testID="59:629" style={styles.tengoAnsiedad__}>
                    {`Tengo ansiedad 😰`}
                  </Text>
                </Pressable>
                <Pressable testID="59:630" style={styles.button8}>
                  <Text testID="59:631" style={styles.noPuedoDormir__}>
                    {`No puedo dormir 🌙`}
                  </Text>
                </Pressable>
                <Pressable testID="59:632" style={styles.button9}>
                  <Text testID="59:633" style={styles.meSientoSolo__}>
                    {`Me siento solo 😔`}
                  </Text>
                </Pressable>
                <Pressable testID="59:634" style={styles.button10}>
                  <Text testID="59:635" style={styles.soloQuieroHablar__}>
                    {`Solo quiero hablar 💬`}
                  </Text>
                </Pressable>
                <Pressable testID="59:636" style={styles.button11}>
                  <Text testID="59:637" style={styles.tecnicaDeCalma__}>
                    {`Técnica de calma 🌿`}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
            <View testID="59:638" style={styles.monoChat4}>
              <View testID="59:639" style={styles.container31}>
                <TextInput
                  style={[styles.textInput, { color: 'white' }]}
                  placeholder="Escríbele a Mono..."
                  placeholderTextColor="rgba(58, 58, 68, 1)"
                />
              </View>
            </View>
          </View>
        </View>
      </View>
      <View testID="59:666" style={styles.container32}>
        <View testID="59:667" style={styles.container33}>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    borderBottomLeftRadius: 52,
    borderBottomRightRadius: 52,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    backgroundColor: 'rgba(11, 13, 24, 1)',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bienestarTab: {
    flex: 1,
    flexShrink: 0,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(5, 6, 15, 1)',
  },
  container2: {
    display: 'none',
    width: 400,
    height: 400,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  container3: {
    display: 'none',
    width: 280,
    height: 280,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  container4: {
    display: 'none',
    width: 360,
    height: 360,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  container5: {
    display: 'none',
    width: 300,
    height: 300,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  container6: {
    display: 'none',
    width: 220,
    height: 220,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  container7: {
    display: 'none',
    width: 160,
    height: 160,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  __: {
    color: 'rgba(245, 158, 11, 1)',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 32,
  },
  container8: {
    position: 'absolute',
    width: '100%',
    height: 812,
  },
  container9: {
    width: 30,
    height: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    opacity: 0.06,
  },
  __2: {
    color: 'rgba(245, 158, 11, 1)',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 32,
  },
  container10: {
    width: 30,
    height: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    opacity: 0.05,
  },
  __3: {
    color: 'rgba(245, 158, 11, 1)',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 32,
  },
  container11: {
    width: 30,
    height: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    opacity: 0.045,
  },
  __4: {
    color: 'rgba(245, 158, 11, 1)',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 32,
  },
  container12: {
    width: 30,
    height: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    opacity: 0.055,
  },
  __5: {
    color: 'rgba(245, 158, 11, 1)',
    fontFamily: 'Inter',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 32,
  },
  container13: {
    width: 30,
    height: 32,
    flexDirection: 'column',
    alignItems: 'flex-start',
    opacity: 0.045,
  },
  container14: {
    flexDirection: 'row',
    width: '100%',
    height: 100,
    paddingTop: 56,
    paddingLeft: 16,
    paddingBottom: 12,
    paddingRight: 16,
    alignItems: 'center',
    rowGap: 12,
    columnGap: 12,
  },
  button: {
    flexDirection: 'row',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.10196078568696976)',
    backgroundColor: 'rgba(255, 255, 255, 0.07058823853731155)',
  },
  mono: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  container15: {
    flexDirection: 'row',
    width: 299,
    height: 32,
    alignItems: 'flex-start',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  button2: {
    width: 68.75,
    height: 32,
    paddingTop: 6,
    paddingLeft: 0,
    paddingBottom: 6,
    paddingRight: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: 'rgba(245, 158, 11, 0.3490196168422699)',
    shadowRadius: 12,
    shadowOffset: {"width":0,"height":2},
  },
  diario: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  button3: {
    width: 70.75,
    height: 32,
    paddingTop: 6,
    paddingLeft: 0,
    paddingBottom: 6,
    paddingRight: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.0784313753247261)',
    backgroundColor: 'rgba(255, 255, 255, 0.05098039284348488)',
  },
  sonidos: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  button4: {
    width: 70.75,
    height: 32,
    paddingTop: 6,
    paddingLeft: 0,
    paddingBottom: 6,
    paddingRight: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.0784313753247261)',
    backgroundColor: 'rgba(255, 255, 255, 0.05098039284348488)',
  },
  respira: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  button5: {
    width: 70.75,
    height: 32,
    paddingTop: 6,
    paddingLeft: 0,
    paddingBottom: 6,
    paddingRight: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.0784313753247261)',
    backgroundColor: 'rgba(255, 255, 255, 0.05098039284348488)',
  },
  __6: {
    color: 'rgba(10, 10, 10, 1)',
    fontFamily: 'Inter',
    fontSize: 25.76,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 25.767,
  },
  container16: {
    width: '100%',
    flex: 1,
    paddingBottom: 27,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  monoChat: {
    width: '100%',
    height: 128,
    paddingTop: 12,
    paddingLeft: 20,
    paddingBottom: 12,
    paddingRight: 20,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  container17: {
    flexDirection: 'row',
    height: 46,
    alignItems: 'center',
    rowGap: 12,
    columnGap: 12,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  container18: {
    width: 46,
    height: 46,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  monoAvatar: {
    flexDirection: 'row',
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'stretch',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: 'rgba(251, 191, 36, 0.45098039507865906)',
    shadowRadius: 18.4,
    shadowOffset: {"width":0,"height":0},
  },
  margin: {
    flexDirection: 'row',
    paddingTop: 1.84,
    alignItems: 'flex-start',
  },
  text: {
    width: 32,
    height: 25.767,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  container19: {
    width: 62.1,
    height: 62.1,
    position: 'absolute',
    left: -8.05,
    top: -8.05,
    borderRadius: 999,
    opacity: 0.5496,
    backgroundColor: 'rgba(251, 191, 36, 0.250980406999588)',
  },
  container20: {
    width: 11,
    height: 11,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'rgba(5, 6, 15, 1)',
    backgroundColor: 'rgba(35, 165, 89, 1)',
  },
  mono2: {
    color: 'rgba(255, 255, 255, 1)',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  container21: {
    width: 277,
    height: 40.5,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  container22: {
    flexDirection: 'row',
    height: 24,
    alignItems: 'center',
    rowGap: 8,
    columnGap: 8,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  heading2: {
    width: 42.9,
    height: 24,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  enLinea: {
    color: 'rgba(251, 191, 36, 1)',
    fontFamily: 'Inter',
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 13.5,
  },
  text2: {
    width: 52.2,
    height: 19.5,
    paddingTop: 2,
    paddingLeft: 8,
    paddingBottom: 2,
    paddingRight: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.250980406999588)',
    backgroundColor: 'rgba(251, 191, 36, 0.14901961386203766)',
  },
  tuCompaneroDeBienestarSiempreAqui__: {
    color: 'rgba(143, 132, 224, 1)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16.5,
  },
  paragraph: {
    height: 16.5,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  _: {
    color: 'rgba(10, 10, 10, 1)',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
  },
  margin2: {
    paddingTop: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
  },
  container23: {
    flexDirection: 'row',
    width: 335,
    height: 46,
    paddingTop: 10,
    paddingLeft: 14,
    paddingBottom: 10,
    paddingRight: 14,
    alignItems: 'center',
    rowGap: 10,
    columnGap: 10,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 13,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.12941177189350128)',
    backgroundColor: 'rgba(251, 191, 36, 0.07058823853731155)',
  },
  text3: {
    width: 20,
    height: 24,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  espacioSeguroSoloEntreTuYMono: {
    color: 'rgba(212, 184, 150, 1)',
    fontFamily: 'Inter',
    fontSize: 10.5,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 17.067,
  },
  paragraph2: {
    width: 275,
    height: 17.067,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  __7: {
    color: 'rgba(10, 10, 10, 1)',
    fontFamily: 'Inter',
    fontSize: 14.56,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 14.567,
  },
  monoChat2: {
    width: '100%',
    height: 457,
    paddingTop: 0,
    paddingLeft: 16,
    paddingBottom: 8,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 12,
    columnGap: 12,
    flexShrink: 0,
  },
  container24: {
    flexDirection: 'row',
    width: 343,
    height: 122.033,
    alignItems: 'flex-end',
    rowGap: 10,
    columnGap: 10,
    flexShrink: 0,
  },
  monoAvatar2: {
    flexDirection: 'row',
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: 'rgba(251, 191, 36, 0.45098039507865906)',
    shadowRadius: 10.4,
    shadowOffset: {"width":0,"height":0},
  },
  text4: {
    width: 18,
    height: 15.607,
    paddingTop: 1.04,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  holaSoyMono__TuCompaneroDeBienestarEnLa: {
    width: 234,
    color: 'rgba(232, 223, 200, 1)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 21.133,
  },
  container25: {
    width: 267.53299,
    height: 122.033,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 2,
    columnGap: 2,
    flexShrink: 0,
  },
  container26: {
    width: 267.53299,
    height: 106.533,
    paddingTop: 10,
    paddingLeft: 16,
    paddingBottom: 10,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.16078431904315948)',
    backgroundColor: 'rgba(30, 24, 48, 0.8509804010391235)',
  },
  $49AM: {
    color: 'rgba(58, 58, 68, 1)',
    fontFamily: 'Inter',
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 13.5,
  },
  text5: {
    width: 267.53299,
    height: 13.5,
    paddingTop: 0,
    paddingLeft: 4,
    paddingBottom: 0,
    paddingRight: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  __8: {
    color: 'rgba(10, 10, 10, 1)',
    fontFamily: 'Inter',
    fontSize: 14.56,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 14.567,
  },
  container27: {
    flexDirection: 'row',
    width: 343,
    height: 79.767,
    alignItems: 'flex-end',
    rowGap: 10,
    columnGap: 10,
    flexShrink: 0,
  },
  monoAvatar3: {
    flexDirection: 'row',
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: 'rgba(251, 191, 36, 0.45098039507865906)',
    shadowRadius: 10.4,
    shadowOffset: {"width":0,"height":0},
  },
  text6: {
    width: 18,
    height: 15.607,
    paddingTop: 1.04,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  comoEstasHoyCuentameLoQueSea__: {
    width: 234,
    color: 'rgba(232, 223, 200, 1)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 21.133,
  },
  container28: {
    width: 267.53299,
    height: 79.767,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 2,
    columnGap: 2,
    flexShrink: 0,
  },
  container29: {
    width: 267.53299,
    height: 64.267,
    paddingTop: 10,
    paddingLeft: 16,
    paddingBottom: 10,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.16078431904315948)',
    backgroundColor: 'rgba(30, 24, 48, 0.8509804010391235)',
  },
  $49AM2: {
    color: 'rgba(58, 58, 68, 1)',
    fontFamily: 'Inter',
    fontSize: 9,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 13.5,
  },
  text7: {
    width: 267.53299,
    height: 13.5,
    paddingTop: 0,
    paddingLeft: 4,
    paddingBottom: 0,
    paddingRight: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  meSientoEstresado__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  monoChat3: {
    width: '100%',
    height: 42.5,
    paddingTop: 0,
    paddingLeft: 16,
    paddingBottom: 8,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  container30: {
    flexDirection: 'row',
    height: 34.5,
    paddingBottom: 4,
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  button6: {
    width: 149.633,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  tengoAnsiedad__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  button7: {
    width: 126.6,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  noPuedoDormir__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  button8: {
    width: 131.767,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  meSientoSolo__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  button9: {
    width: 119.567,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  soloQuieroHablar__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  button10: {
    width: 138.883,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  tecnicaDeCalma__: {
    color: 'rgba(212, 168, 71, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16.5,
  },
  button11: {
    width: 135.14999,
    height: 30.5,
    paddingTop: 6,
    paddingLeft: 12,
    paddingBottom: 6,
    paddingRight: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.21960784494876862)',
    backgroundColor: 'rgba(251, 191, 36, 0.0784313753247261)',
  },
  escribeleAMono: {
    alignSelf: 'stretch',
    color: 'rgba(58, 58, 68, 1)',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 19.5,
  },
  monoChat4: {
    width: '100%',
    height: 57.5,
    paddingTop: 4,
    paddingLeft: 16,
    paddingBottom: 8,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  container31: {
    flexDirection: 'row',
    height: 45.5,
    paddingTop: 12,
    paddingLeft: 16,
    paddingBottom: 12,
    paddingRight: 16,
    alignItems: 'center',
    rowGap: 12,
    columnGap: 12,
    flexShrink: 0,
    alignSelf: 'stretch',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(251, 191, 36, 0.18039216101169586)',
    backgroundColor: 'rgba(20, 16, 36, 0.8784313797950745)',
    shadowColor: 'rgba(251, 191, 36, 0.05882352963089943)',
    shadowRadius: 24,
    shadowOffset: {"width":0,"height":0},
  },
  textInput: {
    width: 309,
    height: 19.5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  container32: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  container33: {
    width: 112,
    height: 4,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18039216101169586)',
  },
});
