import { View, Image, Text, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  username?: string;
}

export function Avatar({ uri, size = 32, username }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.4 }]}>
        {(username || '?')[0].toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#FAFAFA',
  },
  placeholder: {
    backgroundColor: '#0095F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  letter: {
    color: '#FFF',
    fontWeight: '600',
  },
});
