import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';

interface StoryRingProps {
  uri?: string | null;
  username: string;
  hasStory: boolean;
  onPress: () => void;
  size?: number;
}

export function StoryRing({ uri, username, hasStory, onPress, size = 64 }: StoryRingProps) {
  const ringSize = size + 6;
  const avatarSize = size;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.ring,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderColor: hasStory ? '#C13584' : '#DBDBDB',
            borderWidth: hasStory ? 3 : 2,
          },
        ]}
      >
        <Avatar uri={uri} username={username} size={avatarSize} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
