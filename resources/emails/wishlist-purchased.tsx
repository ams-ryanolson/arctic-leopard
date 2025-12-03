import { Heading, Img, Section, Text } from '@react-email/components';
import * as React from 'react';

import {
    colors,
    Divider,
    EmailWrapper,
    PrimaryButton,
    SecondaryButton,
    styles,
    UserCard,
} from './components/shared';

interface WishlistPurchasedEmailProps {
    creatorName: string;
    buyerName: string;
    buyerUsername: string;
    buyerAvatarUrl?: string;
    itemName: string;
    itemImageUrl?: string;
    itemPrice: string;
    message?: string;
}

export default function WishlistPurchasedEmail({
    creatorName = 'Creator',
    buyerName = 'GenerousFan',
    buyerUsername = 'generousfan',
    buyerAvatarUrl = 'https://beta-cdn.realkink.men/emails/default-avatar.png',
    itemName = 'Leather Harness - Mr. S Leather',
    itemImageUrl = 'https://beta-cdn.realkink.men/emails/wishlist-item.png',
    itemPrice = '$150.00',
    message = "You deserve this! Can't wait to see you wear it 🔥",
}: WishlistPurchasedEmailProps) {
    return (
        <EmailWrapper
            preview={`🎁 ${buyerName} bought something from your wishlist!`}
        >
            <Heading style={styles.heading}>Wishlist Gift! 🎁</Heading>
            <Text style={styles.subheading}>
                Someone bought you something special
            </Text>

            <UserCard
                avatarUrl={buyerAvatarUrl}
                name={buyerName}
                username={buyerUsername}
            />

            <Section
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    margin: '24px 0',
                }}
            >
                {itemImageUrl && (
                    <Img
                        src={itemImageUrl}
                        alt={itemName}
                        width="100%"
                        style={{
                            display: 'block',
                            maxHeight: '200px',
                            objectFit: 'cover',
                        }}
                    />
                )}
                <Section style={{ padding: '20px' }}>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px',
                        }}
                    >
                        {itemName}
                    </Text>
                    <Text
                        style={{
                            color: colors.accent,
                            fontSize: '24px',
                            fontWeight: '700',
                            margin: 0,
                        }}
                    >
                        {itemPrice}
                    </Text>
                </Section>
            </Section>

            {message && (
                <Section
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        margin: '24px 0',
                    }}
                >
                    <Text
                        style={{
                            color: colors.textMuted,
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            margin: '0 0 8px',
                        }}
                    >
                        Their Message
                    </Text>
                    <Text
                        style={{
                            color: colors.text,
                            fontSize: '15px',
                            lineHeight: '24px',
                            margin: 0,
                            fontStyle: 'italic',
                        }}
                    >
                        "{message}"
                    </Text>
                </Section>
            )}

            <PrimaryButton href="https://realkink.men/settings/wishlist">
                View Wishlist
            </PrimaryButton>

            <Divider />

            <Section style={{ textAlign: 'center' }}>
                <Text
                    style={{
                        color: colors.textMuted,
                        fontSize: '13px',
                        margin: '0 0 16px',
                    }}
                >
                    Don't forget to thank them!
                </Text>
                <SecondaryButton
                    href={`https://realkink.men/@${buyerUsername}`}
                >
                    Send a Thank You
                </SecondaryButton>
            </Section>
        </EmailWrapper>
    );
}

