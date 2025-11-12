import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.Scanner;
import java.util.StringTokenizer;


public class Main {
    public static void main(String[] args) throws IOException {
        Scanner in = new Scanner(System.in);

        int N = in.nextInt();
        StringBuilder sb = new StringBuilder();

        for(int i=0; i<N/4; i++){
            sb.append("long ");
        }
        sb.append("int");

        System.out.println(sb);
    }
}