import { useAuth } from '@/src/auth/AuthProvider';
import { borderRadius, colors, fonts, spacing } from '@/styles/global';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';

function titleCase(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/(^|[\s'-])([a-z])/g, (_, separator, letter) =>
            `${separator}${letter.toUpperCase()}`
        );
}

export default function RegisterScreen() {
    const { signUp } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const { width } = useWindowDimensions();
    const formWidth = Math.min(width - spacing.xxxl * 2, 420);

    function goToStep(nextStep: 1 | 2) {
        setError('');
        setStep(nextStep);
    }

    function handleNext() {
        if (!firstName.trim() || !lastName.trim()) {
            setError('Enter your first name and last name to continue.');
            return;
        }

        goToStep(2);
    }

    async function handleRegister() {
        if (!email.trim() || !password || !confirmPassword) {
            setError('Enter your email and password to continue.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const nameParts = {
                firstName: firstName.trim(),
                middleName: middleName.trim(),
                lastName: lastName.trim(),
            };
            const displayName = [nameParts.firstName, nameParts.middleName, nameParts.lastName]
                .filter(Boolean)
                .map(titleCase)
                .join(' ');

            await signUp(email.trim(), password, displayName, nameParts);
            router.replace('/(tabs)');
        } catch (signUpError) {
            setError(
                signUpError instanceof Error
                    ? signUpError.message
                    : 'Unable to create your account. Please try again.'
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
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Create an account</Text>
                <Text style={styles.subtitle}>
                    Register to access your health records workspace.
                </Text>

                <Text style={styles.stepLabel}>Step {step} of 2</Text>
                <View style={[styles.stepViewport, { width: formWidth }]}>
                    <View
                        style={[
                            styles.stepTrack,
                            { width: formWidth * 2 },
                            { transform: [{ translateX: step === 1 ? 0 : -formWidth }] },
                        ]}
                    >
                        <View style={[styles.step, { width: formWidth }]}>
                            <Text style={styles.label}>
                                First name<Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                autoCapitalize="words"
                                autoComplete="name-given"
                                onChangeText={setFirstName}
                                placeholder="First name"
                                placeholderTextColor={colors.textTertiary}
                                style={styles.input}
                                value={firstName}
                            />

                            <Text style={styles.label}>Middle name</Text>
                            <TextInput
                                autoCapitalize="words"
                                onChangeText={setMiddleName}
                                placeholder="Middle name (optional)"
                                placeholderTextColor={colors.textTertiary}
                                style={styles.input}
                                value={middleName}
                            />

                            <Text style={styles.label}>
                                Last name<Text style={styles.required}> *</Text>
                            </Text>
                            <TextInput
                                autoCapitalize="words"
                                autoComplete="name-family"
                                onChangeText={setLastName}
                                placeholder="Last name"
                                placeholderTextColor={colors.textTertiary}
                                style={styles.input}
                                value={lastName}
                            />

                            {step === 1 && error ? <Text style={styles.error}>{error}</Text> : null}

                            <Pressable
                                accessibilityRole="button"
                                onPress={handleNext}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                ]}
                            >
                                <Text style={styles.buttonText}>Next</Text>
                            </Pressable>
                        </View>

                        <View style={[styles.step, { width: formWidth }]}>
                            <Text style={styles.label}>
                                Email address<Text style={styles.required}> *</Text>
                            </Text>
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

                            <Text style={styles.label}>
                                Password<Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    onChangeText={setPassword}
                                    placeholder="Create a password"
                                    placeholderTextColor={colors.textTertiary}
                                    secureTextEntry={!showPassword}
                                    style={[styles.input, styles.inputWithToggle]}
                                    value={password}
                                />
                                <Pressable
                                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                                    accessibilityRole="button"
                                    hitSlop={8}
                                    onPress={() => setShowPassword((visible) => !visible)}
                                    style={styles.toggleButton}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            </View>

                            <Text style={styles.label}>
                                Confirm password<Text style={styles.required}> *</Text>
                            </Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    onChangeText={setConfirmPassword}
                                    placeholder="Re-enter your password"
                                    placeholderTextColor={colors.textTertiary}
                                    secureTextEntry={!showConfirmPassword}
                                    style={[styles.input, styles.inputWithToggle]}
                                    value={confirmPassword}
                                />
                                <Pressable
                                    accessibilityLabel={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                                    accessibilityRole="button"
                                    hitSlop={8}
                                    onPress={() => setShowConfirmPassword((visible) => !visible)}
                                    style={styles.toggleButton}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={colors.textSecondary}
                                    />
                                </Pressable>
                            </View>

                            {step === 2 && error ? <Text style={styles.error}>{error}</Text> : null}

                            <Pressable
                                accessibilityRole="button"
                                disabled={submitting}
                                onPress={handleRegister}
                                style={({ pressed }) => [
                                    styles.button,
                                    pressed && styles.buttonPressed,
                                    submitting && styles.buttonDisabled,
                                ]}
                            >
                                {submitting ? (
                                    <ActivityIndicator color={colors.textOnPrimary} />
                                ) : (
                                    <Text style={styles.buttonText}>Create account</Text>
                                )}
                            </Pressable>

                            <Pressable
                                accessibilityRole="button"
                                disabled={submitting}
                                onPress={() => goToStep(1)}
                                style={styles.backLink}
                            >
                                <Text style={styles.backLinkText}>Back</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <Pressable
                    accessibilityRole="link"
                    onPress={() => router.replace('/(auth)/login')}
                    style={styles.signInLink}
                >
                    <Text style={styles.backLinkText}>Already have an account? Sign in</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: spacing.xxxl,
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
    },
    stepLabel: {
        color: colors.primary,
        fontFamily: fonts.semiBold,
        fontSize: 12,
        marginTop: spacing.xxl,
    },
    stepViewport: {
        marginTop: spacing.sm,
        overflow: 'hidden',
    },
    stepTrack: {
        flexDirection: 'row',
    },
    step: {
        flexShrink: 0,
    },
    signInLink: {
        alignSelf: 'center',
        marginTop: spacing.xl,
    },
    label: {
        color: colors.text,
        fontFamily: fonts.medium,
        fontSize: 13,
        marginBottom: spacing.sm,
        marginTop: spacing.lg,
    },
    required: {
        color: colors.error,
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
    inputContainer: {
        position: 'relative',
    },
    inputWithToggle: {
        paddingRight: spacing.xxxl + spacing.sm,
    },
    toggleButton: {
        alignItems: 'center',
        height: 52,
        justifyContent: 'center',
        position: 'absolute',
        right: spacing.sm,
        top: 0,
        width: spacing.xxxl,
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
    backLink: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    backLinkText: {
        color: colors.primary,
        fontFamily: fonts.semiBold,
        fontSize: 14,
    },
});