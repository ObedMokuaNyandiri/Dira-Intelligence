import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 110,
          background: 'linear-gradient(145deg, #181818 0%, #050505 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C8A97E',
          borderRadius: '40px',
          border: '5px solid #C8A97E',
          fontWeight: 900,
          fontFamily: 'serif',
          boxShadow: 'inset 0 0 20px rgba(200, 169, 126, 0.25)',
        }}
      >
        D
      </div>
    ),
    {
      ...size,
    }
  );
}
