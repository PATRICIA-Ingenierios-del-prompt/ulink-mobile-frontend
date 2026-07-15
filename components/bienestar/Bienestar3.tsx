import {StyleSheet} from 'react-native';
import {View, Text, Pressable, ScrollView} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import type {ViewStyle, StyleProp} from 'react-native';

export interface Bienestar3Props {
  /** Used to override the default root style. */
  style?: StyleProp<ViewStyle>,
  /** Used to locate this view in end-to-end tests. */
  testID?: string,
  onTabChange?: (index: 1 | 2 | 3 | 4) => void,
}

export function Bienestar3(props: Bienestar3Props) {
  const router = useRouter();
  return (
    <View testID={props.testID ?? "113:254"} style={[styles.root, props.style]}>
      <View testID="59:787" style={styles.container}>
        <View testID="59:788" style={styles.bienestarTab}>
          <View testID="59:789" style={styles.container2}>
          </View>
          <View testID="59:790" style={styles.container3}>
          </View>
          <View testID="59:791" style={styles.container4}>
          </View>
          <View testID="59:792" style={styles.container5}>
          </View>
          <View testID="59:793" style={styles.container6}>
          </View>
          <View testID="59:794" style={styles.container7}>
            <View testID="59:800" style={styles.container11}>
              <Text testID="59:801" style={styles.__3}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:802" style={styles.container12}>
              <Text testID="59:803" style={styles.__4}>
                {`🐾`}
              </Text>
            </View>
            <View testID="59:804" style={styles.container13}>
              <Text testID="59:805" style={styles.__5}>
                {`🐾`}
              </Text>
            </View>
          </View>
          <ScrollView testID="59:819"
            style={styles.sonidosSection}
            contentContainerStyle={styles.sonidosSectionContent}>
            <View testID="59:820" style={styles.paragraph}>
              <Text testID="59:821" style={styles.activaLosQueQuierasCombinar}>
                {`Activa los que quieras combinar`}
              </Text>
            </View>
            <View testID="59:822" style={styles.container16}>
              <View testID="59:823" style={styles.button6}>
                <Text testID="59:824" style={styles.___}>
                  {`🌧️`}
                </Text>
                <Text testID="59:825" style={styles.lluvia}>
                  {`Lluvia`}
                </Text>
                <View testID="59:826" style={styles.container17}>
                  <View testID="59:827" style={styles.container18}>
                  </View>
                  <View testID="59:828" style={styles.text}>
                    <Text testID="59:829" style={styles.silencio}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:830" style={styles.button7}>
                <Text testID="59:831" style={styles.__6}>
                  {`🌿`}
                </Text>
                <Text testID="59:832" style={styles.bosque}>
                  {`Bosque`}
                </Text>
                <View testID="59:833" style={styles.container19}>
                  <View testID="59:834" style={styles.container20}>
                  </View>
                  <View testID="59:835" style={styles.text2}>
                    <Text testID="59:836" style={styles.silencio2}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:837" style={styles.button8}>
                <Text testID="59:838" style={styles.__7}>
                  {`🌊`}
                </Text>
                <Text testID="59:839" style={styles.olas}>
                  {`Olas`}
                </Text>
                <View testID="59:840" style={styles.container21}>
                  <View testID="59:841" style={styles.container22}>
                  </View>
                  <View testID="59:842" style={styles.text3}>
                    <Text testID="59:843" style={styles.silencio3}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:844" style={styles.button9}>
                <Text testID="59:845" style={styles.__8}>
                  {`🎵`}
                </Text>
                <Text testID="59:846" style={styles.loFi}>
                  {`Lo-fi`}
                </Text>
                <View testID="59:847" style={styles.container23}>
                  <View testID="59:848" style={styles.container24}>
                  </View>
                  <View testID="59:849" style={styles.text4}>
                    <Text testID="59:850" style={styles.silencio4}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:851" style={styles.button10}>
                <Text testID="59:852" style={styles.__9}>
                  {`💨`}
                </Text>
                <Text testID="59:853" style={styles.viento}>
                  {`Viento`}
                </Text>
                <View testID="59:854" style={styles.container25}>
                  <View testID="59:855" style={styles.container26}>
                  </View>
                  <View testID="59:856" style={styles.text5}>
                    <Text testID="59:857" style={styles.silencio5}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:858" style={styles.button11}>
                <Text testID="59:859" style={styles.__10}>
                  {`🔥`}
                </Text>
                <Text testID="59:860" style={styles.hoguera}>
                  {`Hoguera`}
                </Text>
                <View testID="59:861" style={styles.container27}>
                  <View testID="59:862" style={styles.container28}>
                  </View>
                  <View testID="59:863" style={styles.text6}>
                    <Text testID="59:864" style={styles.silencio6}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:865" style={styles.button12}>
                <Text testID="59:866" style={styles._}>
                  {`☕`}
                </Text>
                <Text testID="59:867" style={styles.cafe}>
                  {`Café`}
                </Text>
                <View testID="59:868" style={styles.container29}>
                  <View testID="59:869" style={styles.container30}>
                  </View>
                  <View testID="59:870" style={styles.text7}>
                    <Text testID="59:871" style={styles.silencio7}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
              <View testID="59:872" style={styles.button13}>
                <Text testID="59:873" style={styles.__11}>
                  {`🌌`}
                </Text>
                <Text testID="59:874" style={styles.cosmos}>
                  {`Cosmos`}
                </Text>
                <View testID="59:875" style={styles.container31}>
                  <View testID="59:876" style={styles.container32}>
                  </View>
                  <View testID="59:877" style={styles.text8}>
                    <Text testID="59:878" style={styles.silencio8}>
                      {`Silencio`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      <View testID="59:903" style={styles.container33}>
        <View testID="59:904" style={styles.container34}>
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
    color: 'rgba(90, 90, 104, 1)',
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
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 18,
  },
  button4: {
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
  activaLosQueQuierasCombinar: {
    color: 'rgba(90, 90, 104, 1)',
    fontFamily: 'Inter',
    fontSize: 11,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16.5,
  },
  sonidosSection: {
    width: '100%',
    flex: 1,
  },
  sonidosSectionContent: {
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 112,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  paragraph: {
    width: 343,
    height: 16.5,
    paddingTop: 0,
    paddingLeft: 4,
    paddingBottom: 0,
    paddingRight: 4,
    flexDirection: 'column',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  ___: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  lluvia: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  container16: {
    width: '100%',
    paddingHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  button6: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container17: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container18: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __6: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  bosque: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button7: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container19: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container20: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio2: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text2: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __7: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  olas: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button8: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container21: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container22: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio3: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text3: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __8: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  loFi: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button9: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container23: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container24: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio4: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text4: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __9: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  viento: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button10: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container25: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container26: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio5: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text5: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __10: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  hoguera: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button11: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container27: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container28: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio6: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text6: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  _: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  cafe: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button12: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container29: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container30: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio7: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text7: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  __11: {
    color: 'rgba(10, 10, 10, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 30,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 36,
  },
  cosmos: {
    color: 'rgba(255, 255, 255, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 19.5,
  },
  button13: {
    width: 165.5,
    height: 120.5,
    paddingTop: 16,
    paddingLeft: 16,
    paddingBottom: 16,
    paddingRight: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: 8,
    columnGap: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.07058823853731155)',
    backgroundColor: 'rgba(255, 255, 255, 0.0313725508749485)',
  },
  container31: {
    flexDirection: 'row',
    width: 51.9,
    height: 15,
    alignItems: 'center',
    rowGap: 6,
    columnGap: 6,
    flexShrink: 0,
  },
  container32: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    backgroundColor: 'rgba(58, 58, 68, 1)',
  },
  silencio8: {
    color: 'rgba(90, 90, 104, 1)',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 15,
  },
  text8: {
    width: 37.9,
    height: 15,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  container33: {
    flexDirection: 'row',
    width: '100%',
    height: 4,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  container34: {
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
