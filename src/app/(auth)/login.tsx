import { useAuth } from '@/src/auth/AuthProvider';
import { borderRadius, colors, fonts, spacing } from '@/styles/global';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleLogin() {
        if (!email.trim() || !password) {
            setError('Enter your email and password to continue.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            await signIn(email.trim(), password);
            router.replace('/(tabs)');
        } catch (signInError) {
            setError(
                signInError instanceof Error
                    ? signInError.message
                    : 'Unable to sign in. Check your details and try again.'
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Image
                        accessibilityLabel="CHRIS logo"
                        source={require('@/assets/images/icon.png')}
                        style={styles.brandMark}
                    />
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>
                        Sign in to continue to your health records workspace.
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.form}>
                        <Text style={styles.label}>Email address</Text>
                        <TextInput
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect={false}
                            keyboardType="email-address"
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={colors.textTertiary}
                            style={styles.input}
                            value={email}
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            autoCapitalize="none"
                            autoComplete="password"
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textTertiary}
                            secureTextEntry
                            style={styles.input}
                            value={password}
                        />

                        {error ? <Text style={styles.error}>{error}</Text> : null}

                        <Pressable
                            accessibilityRole="button"
                            disabled={submitting}
                            onPress={handleLogin}
                            style={({ pressed }) => [
                                styles.button,
                                pressed && styles.buttonPressed,
                                submitting && styles.buttonDisabled,
                            ]}
                        >
                            {submitting ? (
                                <ActivityIndicator color={colors.textOnPrimary} />
                            ) : (
                                <Text style={styles.buttonText}>Sign in</Text>
                            )}
                        </Pressable>

                        <View style={styles.registerPrompt}>
                            <Text style={styles.registerText}>
                                Don&apos;t have an account?{' '}
                            </Text>
                            <Pressable
                                accessibilityRole="link"
                                onPress={() => router.push('/(auth)/register')}
                            >
                                <Text style={styles.registerLink}>Sign Up</Text>
                            </Pressable>
                        </View>

                    </View>
                   
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.xxxl,
        paddingTop: spacing.xxxl * 2,
    },
    header: {
        alignItems: 'flex-start',
    },
    formContainer: {
        marginTop: spacing.xxxl,
    },
    brandMark: {
        marginBottom: spacing.xl,
        height: 82,
        width: 52,
    },
    title: {
        color: colors.text,
        fontFamily: fonts.bold,
        fontSize: 32,
        marginBottom: spacing.sm,
    },
    subtitle: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        maxWidth: 320,
    },
    form: {
        alignSelf: 'center',
        maxWidth: 420,
        width: '100%',
    },
    label: {
        color: colors.text,
        fontFamily: fonts.medium,
        fontSize: 13,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
    },
    input: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        color: colors.text,
        fontFamily: fonts.regular,
        fontSize: 15,
        height: 52,
        paddingHorizontal: spacing.lg,
    },
    error: {
        color: colors.error,
        fontFamily: fonts.regular,
        fontSize: 13,
        marginTop: spacing.md,
    },
    button: {
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.sm,
        height: 52,
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    buttonPressed: {
        backgroundColor: colors.primaryDark,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: colors.textOnPrimary,
        fontFamily: fonts.semiBold,
        fontSize: 15,
    },
    registerPrompt: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    registerText: {
        color: colors.textSecondary,
        fontFamily: fonts.regular,
        fontSize: 14,
    },
    registerLink: {
        color: colors.primary,
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
});