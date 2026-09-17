import { ImageResponse } from 'next/og';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 19,
          background: 'linear-gradient(145deg, #181818 0%, #080808 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C8A97E',
          borderRadius: '7px',
          border: '1.5px solid #C8A97E',
          fontWeight: 800,
          fontFamily: 'serif',
          boxShadow: 'inset 0 0 4px rgba(200, 169, 126, 0.3)',
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
