import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontFamily, FontSize } from '../../theme';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { authService, User } from '../../services/api/authService';
import { useAuthStore } from '../../store/authStore';

export function ProfileSettings() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Common user fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Patient profile fields
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');

  // Doctor profile fields
  const [specialty, setSpecialty] = useState('');
  const [qualification, setQualification] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationFee, setConsultationFee] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingInitial(true);
        const user = await authService.me();
        if (isMounted && user) {
          setName(user.name || '');
          setPhone(user.phone || '');
          setEmail(user.email || '');

          if (user.patientProfile) {
            setDateOfBirth(user.patientProfile.dateOfBirth || '');
            setGender(user.patientProfile.gender || '');
            setBloodGroup(user.patientProfile.bloodGroup || '');
            setEmergencyContact(user.patientProfile.emergencyContact || '');
            setAddress(user.patientProfile.address || '');
          }

          if (user.doctorProfile) {
            setSpecialty(user.doctorProfile.specialty || '');
            setQualification(user.doctorProfile.qualification || '');
            setExperienceYears(
              user.doctorProfile.experienceYears ? String(user.doctorProfile.experienceYears) : '',
            );
            setConsultationFee(
              user.doctorProfile.consultationFee ? String(user.doctorProfile.consultationFee) : '',
            );
            setBio(user.doctorProfile.bio || '');
          }
        }
      } catch (err) {
        if (isMounted) setErrorMsg('Failed to load profile data.');
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const payload: Record<string, any> = {
        name,
        phone,
      };

      if (role === 'patient') {
        if (dateOfBirth) payload.date_of_birth = dateOfBirth;
        if (gender) payload.gender = gender.toLowerCase();
        if (bloodGroup) payload.blood_group = bloodGroup;
        if (emergencyContact) payload.emergency_contact = emergencyContact;
        if (address) payload.address = address;
      } else if (role === 'doctor') {
        if (specialty) payload.specialty = specialty;
        if (qualification) payload.qualification = qualification;
        if (experienceYears) payload.experience_years = Number(experienceYears);
        if (consultationFee) payload.consultation_fee = Number(consultationFee);
        if (bio) payload.bio = bio;
      }

      await authService.updateProfile(payload);
      setSuccessMsg('Profile updated successfully!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading profile details…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: Spacing.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        {/* Basic Information */}
        <Text style={styles.sectionHeader}>Basic Information</Text>

        <Input
          label={t('profile.fullName') || 'Full Name'}
          value={name}
          onChangeText={setName}
          placeholder={t('profile.fullNamePlaceholder') || 'Enter your full name'}
        />

        <Input
          label={t('profile.phone') || 'Phone Number'}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('profile.phonePlaceholder') || 'Enter your phone number'}
          keyboardType="phone-pad"
        />

        <Input
          label="Email Address"
          value={email}
          editable={false}
          placeholder="Your email address"
        />

        {/* Role-Specific Fields: Patient */}
        {role === 'patient' && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: Spacing.sm }]}>
              Medical & Personal Info
            </Text>

            <Input
              label="Date of Birth (YYYY-MM-DD)"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="e.g. 1995-05-15"
            />

            <Input
              label="Gender"
              value={gender}
              onChangeText={setGender}
              placeholder="male, female, or other"
            />

            <Input
              label="Blood Group"
              value={bloodGroup}
              onChangeText={setBloodGroup}
              placeholder="e.g. O+, A+, B+"
            />

            <Input
              label="Emergency Contact"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Emergency phone number"
              keyboardType="phone-pad"
            />

            <Input
              label="Address"
              value={address}
              onChangeText={setAddress}
              placeholder="Your home address"
            />
          </>
        )}

        {/* Role-Specific Fields: Doctor */}
        {role === 'doctor' && (
          <>
            <Text style={[styles.sectionHeader, { marginTop: Spacing.sm }]}>
              Professional Details
            </Text>

            <Input
              label="Specialty / Department"
              value={specialty}
              onChangeText={setSpecialty}
              placeholder="e.g. Cardiology, Pediatrics"
            />

            <Input
              label="Qualifications"
              value={qualification}
              onChangeText={setQualification}
              placeholder="e.g. MBBS, FCPS"
            />

            <Input
              label="Experience (Years)"
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="e.g. 10"
              keyboardType="numeric"
            />

            <Input
              label="Consultation Fee (BDT)"
              value={consultationFee}
              onChangeText={setConsultationFee}
              placeholder="e.g. 1000"
              keyboardType="numeric"
            />

            <Input
              label="Biography / Overview"
              value={bio}
              onChangeText={setBio}
              placeholder="Brief professional background"
              multiline
            />
          </>
        )}

        <Button label={t('common.save') || 'Save Changes'} onPress={handleSave} loading={saving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  form: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  sectionHeader: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.md,
    color: Colors.primary,
    marginBottom: -Spacing.xs,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
  successText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
});
